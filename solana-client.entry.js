import { address, createClient } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { getAddMemoInstruction } from "@solana-program/memo";

const RPC_URL = "https://api.devnet.solana.com";
const MEMO_PATTERN = /^orbita:v1:introduction:[a-f0-9]{64}$/;
const client = createClient()
  .use(walletSigner({
    chain: "solana:devnet",
    autoConnect: false,
    storage: sessionStorage,
    storageKey: "orbita:solana-wallet"
  }))
  .use(solanaRpc({
    rpcUrl: RPC_URL,
    rpcSubscriptionsUrl: "wss://api.devnet.solana.com",
    transactionConfig: { version: "legacy" },
    skipPreflight: false,
    maxConcurrency: 1
  }));

function errorMessage(error) {
  const text = String(error?.message || error || "").toLowerCase();
  if (error?.name === "AbortError") return "La operación fue cancelada.";
  if (/reject|declin|cancel|denied|user refused|4100/.test(text)) return "La wallet rechazó la conexión o firma. Podés reintentar.";
  if (/insufficient|balance|funds|fee payer/.test(text)) return "La wallet no tiene suficiente SOL de devnet para pagar el fee.";
  if (/blockhash|expired|block height/.test(text)) return "El blockhash expiró. Reintentá para crear una transacción nueva.";
  if (/chain|network|cluster|not supported/.test(text)) return "Cambiate a Solana Devnet para continuar.";
  if (/timeout|timed out|fetch|network|socket|rpc/.test(text)) return "Solana Devnet no respondió a tiempo. Reintentá.";
  return "No pudimos completar la transacción en Solana Devnet. Reintentá.";
}

export async function listWallets() {
  await client.wallet.whenReady();
  return client.wallet.getState().wallets.map(wallet => ({ name: wallet.name, icon: wallet.icon || "" }));
}

async function waitForConfirmation(signature, { timeoutMs = 30_000, pollMs = 800 } = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const response = await client.rpc.getSignatureStatuses([signature], { searchTransactionHistory: true }).send();
    const status = response.value?.[0] || null;
    if (status?.err) throw new Error("transaction failure");
    if (status && ["confirmed", "finalized"].includes(status.confirmationStatus)) return status;
    await new Promise(resolve => setTimeout(resolve, pollMs));
  }
  throw new Error("confirmation timeout");
}

export async function attestMemo({ memo = "", buildMemo, walletName, onState = () => {} }) {
  try {
    await client.wallet.whenReady();
    const wallets = client.wallet.getState().wallets;
    const selected = wallets.find(wallet => wallet.name === walletName);
    if (!selected) throw new Error("wallet not installed");

    onState("connecting");
    const current = client.wallet.getState().connected;
    if (!current || current.wallet.name !== selected.name) await client.wallet.connect(selected);
    const connected = client.wallet.getState().connected;
    if (!connected) throw new Error("wallet disconnected");
    if (!connected.supportedTransactionVersions.has("legacy")) throw new Error("network not supported");
    const wallet = String(connected.account.address);

    memo = typeof buildMemo === "function" ? await buildMemo(wallet) : memo;
    if (!MEMO_PATTERN.test(String(memo || ""))) throw new Error("El Memo no superó el control de privacidad.");

    onState("preparing");
    const balance = await client.rpc.getBalance(address(wallet), { commitment: "confirmed" }).send();
    if (BigInt(balance.value) < 5_000n) throw new Error("insufficient funds for fee");

    onState("signing");
    const instruction = getAddMemoInstruction({ memo });
    if (!MEMO_PATTERN.test(memo)) throw new Error("Memo privacy assertion failed before broadcast");
    onState("sending");
    const result = await client.sendTransaction([instruction]);
    const signature = String(result?.context?.signature || "");
    if (!signature) throw new Error("send failure: missing signature");
    onState("confirming");

    const status = await waitForConfirmation(signature);
    return { signature, wallet, memo, confirmationStatus: status.confirmationStatus };
  } catch (error) {
    const mapped = new Error(errorMessage(error));
    mapped.cause = error;
    throw mapped;
  }
}

async function rpcCall(method, params) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    const body = await response.json();
    if (body.error) throw new Error(body.error.message || "RPC error");
    return body.result;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAttestationEvidence(signature) {
  const [transaction, statuses] = await Promise.all([
    rpcCall("getTransaction", [signature, { commitment: "confirmed", encoding: "jsonParsed", maxSupportedTransactionVersion: 1 }]),
    rpcCall("getSignatureStatuses", [[signature], { searchTransactionHistory: true }])
  ]);
  return { rpcTransaction: transaction, rpcStatus: statuses?.value?.[0] || null };
}
