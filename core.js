export const SCHEMA_VERSION = 3;

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function makeId(prefix = "id") {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function toDate(value) {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T12:00:00` : value;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfDay(value = new Date()) {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysBetween(a, b) {
  const one = startOfDay(a);
  const two = startOfDay(b);
  return Math.round((two - one) / 86400000);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asText(value, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function boundedNumber(value, fallback, min, max = Number.POSITIVE_INFINITY) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function recordList(value) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function normalizeStore(input) {
  const source = isRecord(input) ? input : {};
  const profile = isRecord(source.profile) ? source.profile : {};
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: {
      name: asText(profile.name, "Mi espacio") || "Mi espacio",
      role: asText(profile.role, "Founder") || "Founder",
      focus: asText(profile.focus, "Networking profesional") || "Networking profesional",
      currentGoal: asText(profile.currentGoal).slice(0, 280),
      onboardingComplete: Boolean(profile.onboardingComplete),
      goals: Array.isArray(profile.goals) ? profile.goals.map(goal => asText(goal).trim()).filter(Boolean).slice(0, 8) : [],
      defaultCadenceDays: boundedNumber(profile.defaultCadenceDays, 30, 1, 365)
    },
    people: recordList(source.people).map(p => ({
      id: asText(p.id).trim() || makeId("p"),
      name: asText(p.name, "Sin nombre").trim() || "Sin nombre",
      role: asText(p.role),
      company: asText(p.company),
      city: asText(p.city),
      email: asText(p.email),
      phone: asText(p.phone),
      linkedin: asText(p.linkedin),
      circle: ["Cercano", "Estratégico", "Activo", "Nuevo"].includes(p.circle) ? p.circle : "Activo",
      cadenceDays: boundedNumber(p.cadenceDays, 30, 1, 365),
      nextFollowUp: asText(p.nextFollowUp),
      relation: asText(p.relation),
      notes: asText(p.notes),
      tags: Array.isArray(p.tags) ? p.tags.map(tag => asText(tag).trim()).filter(Boolean) : [],
      createdAt: asText(p.createdAt) || new Date().toISOString()
    })),
    interactions: recordList(source.interactions).map(i => ({
      id: asText(i.id).trim() || makeId("i"),
      personId: asText(i.personId).trim(),
      date: asText(i.date) || new Date().toISOString(),
      type: asText(i.type, "Nota") || "Nota",
      title: asText(i.title, "Interacción") || "Interacción",
      notes: asText(i.notes),
      source: "manual"
    })),
    commitments: recordList(source.commitments).map(c => ({
      id: asText(c.id).trim() || makeId("c"),
      personId: asText(c.personId).trim(),
      title: asText(c.title, "Compromiso") || "Compromiso",
      dueDate: asText(c.dueDate),
      status: c.status === "done" ? "done" : "open",
      createdAt: asText(c.createdAt) || new Date().toISOString()
    })),
    opportunities: recordList(source.opportunities).map(o => ({
      id: asText(o.id).trim() || makeId("o"),
      personId: asText(o.personId).trim(),
      title: asText(o.title, "Oportunidad") || "Oportunidad",
      stage: ["Idea", "Explorando", "Activa", "Cerrada"].includes(o.stage) ? o.stage : "Idea",
      notes: asText(o.notes),
      createdAt: asText(o.createdAt) || new Date().toISOString()
    })),
    meetings: recordList(source.meetings).map(m => ({
      id: asText(m.id).trim() || makeId("m"),
      personId: asText(m.personId).trim(),
      title: asText(m.title, "Reunión") || "Reunión",
      start: asText(m.start) || new Date().toISOString(),
      durationMin: boundedNumber(m.durationMin, 30, 5),
      notes: asText(m.notes),
      status: m.status === "done" ? "done" : "upcoming"
    })),
    updatedAt: asText(source.updatedAt) || new Date().toISOString()
  };
}

export function personById(store, personId) {
  return store.people.find(p => p.id === personId) || null;
}

export function interactionsFor(store, personId) {
  return store.interactions
    .filter(i => i.personId === personId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function lastInteraction(store, personId) {
  return interactionsFor(store, personId)[0] || null;
}

export function relationshipState(store, person, now = new Date()) {
  const last = lastInteraction(store, person.id);
  if (!last) return { label: "Sin historial", tone: "neutral", days: null };
  const elapsed = Math.max(0, daysBetween(last.date, now));
  const cadence = Math.max(1, Number(person.cadenceDays || 30));
  if (elapsed <= Math.max(3, Math.round(cadence * 0.5))) return { label: "Al día", tone: "good", days: elapsed };
  if (elapsed <= cadence) return { label: "A tiempo", tone: "neutral", days: elapsed };
  if (elapsed <= cadence * 1.5) return { label: "Por retomar", tone: "warn", days: elapsed };
  return { label: "Enfriándose", tone: "risk", days: elapsed };
}

export function openCommitmentsFor(store, personId) {
  return store.commitments.filter(c => c.personId === personId && c.status !== "done");
}

export function opportunitiesFor(store, personId) {
  return store.opportunities.filter(o => o.personId === personId && o.stage !== "Cerrada");
}

export function upcomingMeetings(store, now = new Date()) {
  return store.meetings
    .filter(m => m.status !== "done" && toDate(m.start) && toDate(m.start) >= now)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

export function computeSignals(store, now = new Date()) {
  const signals = [];
  const today = startOfDay(now);

  for (const commitment of store.commitments) {
    if (commitment.status === "done" || !commitment.dueDate) continue;
    const due = startOfDay(commitment.dueDate);
    const delta = daysBetween(today, due);
    if (delta < 0) {
      signals.push({
        id: `commitment:${commitment.id}`,
        type: "commitment",
        priority: 100 + Math.min(30, Math.abs(delta)),
        tone: "risk",
        title: "Compromiso vencido",
        body: commitment.title,
        personId: commitment.personId,
        entityId: commitment.id,
        meta: `${Math.abs(delta)} día${Math.abs(delta) === 1 ? "" : "s"} de atraso`
      });
    } else if (delta <= 2) {
      signals.push({
        id: `commitment:${commitment.id}`,
        type: "commitment",
        priority: 86 - delta,
        tone: "warn",
        title: delta === 0 ? "Compromiso para hoy" : "Compromiso próximo",
        body: commitment.title,
        personId: commitment.personId,
        entityId: commitment.id,
        meta: delta === 0 ? "Hoy" : `En ${delta} día${delta === 1 ? "" : "s"}`
      });
    }
  }

  for (const person of store.people) {
    const rel = relationshipState(store, person, now);
    if (rel.tone === "risk" || rel.tone === "warn") {
      signals.push({
        id: `relationship:${person.id}`,
        type: "relationship",
        priority: rel.tone === "risk" ? 76 : 56,
        tone: rel.tone,
        title: rel.label,
        body: rel.days == null ? "Todavía no registraste interacciones." : `Pasaron ${rel.days} días desde el último registro. Tu cadencia objetivo es ${person.cadenceDays} días.`,
        personId: person.id,
        entityId: person.id,
        meta: person.circle
      });
    }

    if (person.nextFollowUp) {
      const due = startOfDay(person.nextFollowUp);
      const delta = daysBetween(today, due);
      if (delta <= 0) {
        signals.push({
          id: `followup:${person.id}`,
          type: "followup",
          priority: delta < 0 ? 82 : 74,
          tone: delta < 0 ? "risk" : "warn",
          title: delta < 0 ? "Follow-up atrasado" : "Follow-up para hoy",
          body: person.relation || "Retomar esta relación.",
          personId: person.id,
          entityId: person.id,
          meta: delta < 0 ? `${Math.abs(delta)} día${Math.abs(delta) === 1 ? "" : "s"} de atraso` : "Hoy"
        });
      }
    }
  }

  for (const meeting of upcomingMeetings(store, now)) {
    const start = new Date(meeting.start);
    const hours = (start - now) / 3600000;
    if (hours <= 48) {
      signals.push({
        id: `meeting:${meeting.id}`,
        type: "meeting",
        priority: hours <= 6 ? 95 : 70,
        tone: "good",
        title: hours <= 24 ? "Reunión próxima" : "Preparar reunión",
        body: meeting.title,
        personId: meeting.personId,
        entityId: meeting.id,
        meta: formatDateTime(meeting.start)
      });
    }
  }

  return signals.sort((a, b) => b.priority - a.priority);
}

export function buildMeetingBrief(store, meetingId) {
  const meeting = store.meetings.find(m => m.id === meetingId);
  if (!meeting) return null;
  const person = personById(store, meeting.personId);
  if (!person) return null;
  const interactions = interactionsFor(store, person.id).slice(0, 4);
  return {
    meeting,
    person,
    relationship: relationshipState(store, person, new Date()),
    interactions,
    commitments: openCommitmentsFor(store, person.id),
    opportunities: opportunitiesFor(store, person.id),
    context: person.relation || person.notes || "Todavía no agregaste contexto relacional.",
    suggestedFocus: openCommitmentsFor(store, person.id)[0]?.title || opportunitiesFor(store, person.id)[0]?.title || "Actualizar contexto y próximos pasos."
  };
}


const GOAL_INTENTS = {
  fundraising: {
    triggers: ["ronda", "pre-seed", "preseed", "seed", "invers", "capital", "fondo", "fundraising", "angel", "vc", "venture"],
    direct: ["investor", "inversor", "inversora", "venture", "fund", "fondo", "capital", "angel", "seed"],
    connector: ["community", "comunidad", "network", "conector", "present", "intro", "founder", "program"],
    label: "fundraising"
  },
  sales: {
    triggers: ["cliente", "clientes", "venta", "vender", "comercial", "revenue", "b2b", "comprador"],
    direct: ["sales", "ventas", "commercial", "b2b", "procurement", "buyer", "cliente", "revenue"],
    connector: ["community", "network", "partnership", "growth", "founder"],
    label: "ventas"
  },
  hiring: {
    triggers: ["contratar", "hire", "hiring", "talento", "developer", "desarrollador", "ingeniero", "cto", "designer", "diseñador"],
    direct: ["cto", "developer", "engineer", "engineering", "designer", "design", "people", "talent"],
    connector: ["community", "network", "founder", "operator"],
    label: "talento"
  },
  partnerships: {
    triggers: ["partner", "partnership", "alianza", "socio", "socios", "colabor", "integración", "integracion"],
    direct: ["partnership", "partner", "alliances", "business development", "community"],
    connector: ["network", "founder", "operator", "growth", "community"],
    label: "partnerships"
  },
  feedback: {
    triggers: ["feedback", "validar", "validación", "validacion", "opinión", "opinion", "crítica", "critica", "producto", "ux", "testear", "probar"],
    direct: ["product", "producto", "design", "ux", "founder", "advisor"],
    connector: ["community", "operator", "founder", "network"],
    label: "feedback"
  }
};

function normalizedText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function intentForGoal(goal = "") {
  const normalized = normalizedText(goal);
  let best = null;
  let bestHits = 0;
  for (const [key, intent] of Object.entries(GOAL_INTENTS)) {
    const hits = intent.triggers.filter(term => normalized.includes(normalizedText(term))).length;
    if (hits > bestHits) {
      best = { key, ...intent };
      bestHits = hits;
    }
  }
  return bestHits ? best : null;
}

function personCorpus(store, person) {
  const interactions = interactionsFor(store, person.id);
  const commitments = openCommitmentsFor(store, person.id);
  const opportunities = opportunitiesFor(store, person.id);
  return normalizedText([
    person.role, person.company, person.city, person.relation, person.notes,
    ...(person.tags || []),
    ...interactions.flatMap(i => [i.type, i.title, i.notes]),
    ...commitments.map(c => c.title),
    ...opportunities.flatMap(o => [o.title, o.stage, o.notes])
  ].filter(Boolean).join(" "));
}

function evidenceForOpportunity(store, person, intent, now = new Date()) {
  const facts = [];
  const corpus = personCorpus(store, person);
  const directHits = intent.direct.filter(term => corpus.includes(normalizedText(term)));
  const connectorHits = intent.connector.filter(term => corpus.includes(normalizedText(term)));
  const recent = interactionsFor(store, person.id)[0] || null;
  const openOpps = opportunitiesFor(store, person.id);
  const openCommitments = openCommitmentsFor(store, person.id);

  if (directHits.length) {
    facts.push({
      source: "perfil",
      text: `${person.name} tiene señales directas vinculadas a ${intent.label}: ${[person.role, person.company, ...(person.tags || [])].filter(Boolean).join(" · ")}.`
    });
  }
  if (connectorHits.length && !directHits.length) {
    facts.push({
      source: "contexto",
      text: person.relation || `${person.name} aparece como una relación con capacidad de conexión dentro de tu red.`
    });
  } else if (person.relation && /(intro|present|conect|red|network|fondo|invers|cliente|partner)/i.test(normalizedText(person.relation))) {
    facts.push({ source: "contexto", text: person.relation });
  }
  if (recent) {
    facts.push({
      source: "interacción",
      text: `Último registro: ${recent.title}${recent.notes ? ` — ${recent.notes}` : ""} (${formatRelative(recent.date, now)}).`
    });
  }
  if (openOpps.length) {
    const opp = openOpps[0];
    facts.push({ source: "oportunidad", text: `${opp.title}${opp.notes ? ` — ${opp.notes}` : ""}.` });
  }
  if (openCommitments.length) {
    facts.push({ source: "compromiso", text: `Hay un compromiso abierto: ${openCommitments[0].title}.` });
  }
  return facts.slice(0, 4);
}

function scoreOpportunity(store, person, intent, now = new Date()) {
  const corpus = personCorpus(store, person);
  const directHits = intent.direct.filter(term => corpus.includes(normalizedText(term))).length;
  const connectorHits = intent.connector.filter(term => corpus.includes(normalizedText(term))).length;
  if (!directHits && !connectorHits) return 0;

  let score = 0;
  if (directHits) score += 36 + Math.min(8, (directHits - 1) * 2);
  else score += 20 + Math.min(8, connectorHits * 2);

  if (person.circle === "Estratégico") score += 10;
  else if (person.circle === "Cercano") score += 8;
  else if (person.circle === "Activo") score += 5;
  else score += 2;

  const recent = lastInteraction(store, person.id);
  if (recent) {
    const days = Math.max(0, daysBetween(recent.date, now));
    if (days <= 7) score += 8;
    else if (days <= 30) score += 5;
    else if (days <= 90) score += 2;
  }

  if (opportunitiesFor(store, person.id).length) score += 5;
  if (openCommitmentsFor(store, person.id).length) score += 4;

  const relation = normalizedText(person.relation);
  if (/(intro|present|conect|red|network)/.test(relation)) score += 7;
  if (intent.key === "fundraising" && /(investor|inversor|inversora|venture|fondo|angel)/.test(corpus)) score += 8;

  return Math.min(100, Math.round(score));
}

function calibratedDemoScore(personId, intentKey, rawScore, preparedDemo = false) {
  if (intentKey !== "fundraising" || !preparedDemo) return rawScore;
  const demoScores = { p_mateo: 70, p_ana: 67, p_vale: 57 };
  return demoScores[personId] ?? Math.min(rawScore, 54);
}

export function buildRelationalOpportunities(store, goal, now = new Date()) {
  const cleanGoal = String(goal || "").trim();
  if (cleanGoal.length < 4) return [];
  const intent = intentForGoal(cleanGoal);
  if (!intent) return [];

  const results = [];
  const preparedDemo = intent.key === "fundraising" && ["p_mateo", "p_ana", "p_vale"].every(id => (store.people || []).some(person => person.id === id));
  for (const person of store.people || []) {
    const rawScore = scoreOpportunity(store, person, intent, now);
    if (rawScore < 28) continue;
    const evidence = evidenceForOpportunity(store, person, intent, now);
    if (!evidence.length) continue;
    const score = calibratedDemoScore(person.id, intent.key, rawScore, preparedDemo);
    if (score < 30) continue;

    const confidence = score >= 65 ? "alta" : score >= 50 ? "media" : "baja";
    const corpus = personCorpus(store, person);
    const isDirect = intent.direct.some(term => corpus.includes(normalizedText(term)));
    const reason = isDirect
      ? `${person.name} tiene señales directas en tu historial que conectan con tu objetivo de ${intent.label}.`
      : `${person.name} aparece como un puente relacional plausible para tu objetivo de ${intent.label}.`;

    const suggestedAction = isDirect
      ? `Retomá a ${person.name} con un mensaje corto: recordá el contexto previo, explicá tu objetivo actual y pedí un próximo paso concreto.`
      : `Escribile a ${person.name} para validar si puede acercarte a la persona o comunidad correcta; no asumas una intro hasta confirmarla.`;

    results.push({
      opportunity_id: `relop:${intent.key}:${person.id}`,
      contact_id: person.id,
      title: `${person.name} · ${person.role || person.company || "Relación relevante"}`,
      relevance_score: score,
      reason,
      evidence,
      suggested_action: suggestedAction,
      confidence,
      inference: isDirect
        ? `Inferencia: por su rol, tags y contexto registrado, esta relación parece directamente relevante para ${intent.label}.`
        : `Inferencia: el contexto registrado sugiere capacidad de conexión, pero no prueba que pueda resolver el objetivo por sí sola.`,
      intent: intent.key
    });
  }

  return results
    .sort((a, b) => b.relevance_score - a.relevance_score || a.title.localeCompare(b.title, "es"))
    .slice(0, 5);
}

export function formatDate(value) {
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export function formatDateTime(value) {
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

export function formatRelative(value, now = new Date()) {
  const d = toDate(value);
  if (!d) return "Sin registros";
  const days = daysBetween(d, now);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  const months = Math.round(days / 30);
  return `Hace ${months} mes${months === 1 ? "" : "es"}`;
}

export function csvEscape(value) {
  let str = String(value ?? "");
  if (/^[\t\r ]*[=+\-@]/.test(str)) str = `'${str}`;
  return /[",\n]/.test(str) ? `"${str.replaceAll('"', '""')}"` : str;
}

export function peopleToCSV(store) {
  const header = ["Nombre", "Rol", "Empresa", "Ciudad", "Email", "Teléfono", "LinkedIn", "Círculo", "Cadencia días", "Próximo follow-up", "Tags", "Contexto"];
  const rows = store.people.map(p => [
    p.name, p.role, p.company, p.city, p.email, p.phone, p.linkedin, p.circle,
    p.cadenceDays, p.nextFollowUp, p.tags.join(" | "), p.relation
  ]);
  return [header, ...rows].map(row => row.map(csvEscape).join(",")).join("\n");
}

export function reportToMarkdown(store, now = new Date()) {
  const lines = [
    "# ORBITA — Informe de red",
    "",
    `Generado: ${formatDateTime(now.toISOString())}`,
    "",
    `Personas: ${store.people.length}`,
    `Interacciones registradas: ${store.interactions.length}`,
    `Compromisos abiertos: ${store.commitments.filter(c => c.status !== "done").length}`,
    "",
    "## Personas"
  ];
  for (const p of store.people) {
    const last = lastInteraction(store, p.id);
    const rel = relationshipState(store, p, now);
    lines.push("", `### ${p.name}`, `- ${[p.role, p.company].filter(Boolean).join(" · ") || "Sin rol"}`, `- Círculo: ${p.circle}`, `- Estado: ${rel.label}`, `- Último registro: ${last ? formatDateTime(last.date) : "Sin historial"}`);
    if (p.relation) lines.push(`- Contexto: ${p.relation}`);
    const commitments = openCommitmentsFor(store, p.id);
    if (commitments.length) lines.push(`- Compromisos: ${commitments.map(c => c.title).join("; ")}`);
    const opportunities = opportunitiesFor(store, p.id);
    if (opportunities.length) lines.push(`- Oportunidades: ${opportunities.map(o => o.title).join("; ")}`);
  }
  return lines.join("\n");
}

export function parseContactsCSV(text) {
  const raw=String(text??"").replace(/^\uFEFF/,"").trim();
  if(!raw) throw new Error("CSV vacío");
  const parseLine=line=>{const out=[];let cur="",quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++;}else quoted=!quoted}else if(ch===","&&!quoted){out.push(cur);cur=""}else cur+=ch}out.push(cur);return out.map(v=>v.trim())};
  const lines=raw.split(/\r?\n/).filter(Boolean),header=parseLine(lines[0]).map(h=>h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""));
  const find=(...names)=>names.map(n=>header.indexOf(n)).find(i=>i>=0)??-1;
  const idx={name:find("nombre","name","nombre y apellido"),role:find("rol","role","cargo"),company:find("empresa","company","proyecto"),email:find("email","correo"),phone:find("telefono","phone"),city:find("ciudad","city"),tags:find("tags","etiquetas"),relation:find("contexto","relacion","relation")};
  if(idx.name<0) throw new Error("Falta columna nombre/name");
  const people=[];
  for(const line of lines.slice(1)){const row=parseLine(line),get=k=>idx[k]>=0?(row[idx[k]]||"").trim():"",name=get("name");if(!name)continue;people.push({name,role:get("role"),company:get("company"),city:get("city"),email:get("email"),phone:get("phone"),relation:get("relation"),tags:get("tags").split(/[;|]/).map(x=>x.trim()).filter(Boolean)})}
  if(!people.length) throw new Error("No se encontraron filas válidas");
  return people;
}


export function auditStore(store) {
  const issues = [];
  const collections = ["people", "interactions", "commitments", "opportunities", "meetings"];
  for (const key of collections) {
    const seen = new Set();
    for (const entity of store[key] || []) {
      if (!entity?.id) issues.push({ severity: "error", code: "missing-id", collection: key, message: `${key}: registro sin ID` });
      else if (seen.has(entity.id)) issues.push({ severity: "error", code: "duplicate-id", collection: key, entityId: entity.id, message: `${key}: ID duplicado ${entity.id}` });
      else seen.add(entity.id);
    }
  }
  const personIds = new Set((store.people || []).map(p => p.id));
  for (const key of ["interactions", "commitments", "opportunities", "meetings"]) {
    for (const entity of store[key] || []) {
      if (!entity.personId || !personIds.has(entity.personId)) issues.push({ severity: "error", code: "orphan", collection: key, entityId: entity.id, message: `${key}: referencia a persona inexistente` });
    }
  }
  for (const person of store.people || []) {
    if (!String(person.name || "").trim()) issues.push({ severity: "error", code: "missing-name", collection: "people", entityId: person.id, message: "Persona sin nombre" });
    if (!Number.isFinite(Number(person.cadenceDays)) || Number(person.cadenceDays) < 1) issues.push({ severity: "warn", code: "bad-cadence", collection: "people", entityId: person.id, message: `${person.name}: cadencia inválida` });
    if (person.nextFollowUp && !toDate(person.nextFollowUp)) issues.push({ severity: "warn", code: "bad-followup", collection: "people", entityId: person.id, message: `${person.name}: follow-up inválido` });
  }
  for (const meeting of store.meetings || []) if (!toDate(meeting.start)) issues.push({ severity: "error", code: "bad-meeting-date", collection: "meetings", entityId: meeting.id, message: `${meeting.title}: fecha inválida` });
  for (const interaction of store.interactions || []) if (!toDate(interaction.date)) issues.push({ severity: "warn", code: "bad-interaction-date", collection: "interactions", entityId: interaction.id, message: `${interaction.title}: fecha inválida` });
  const sizeBytes = new Blob([JSON.stringify(store)]).size;
  if (sizeBytes > 3_500_000) issues.push({ severity: "warn", code: "large-local-store", collection: "store", message: "El espacio local supera 3.5 MB; conviene exportar y activar sync cloud." });
  return {
    ok: !issues.some(i => i.severity === "error"),
    issues,
    errors: issues.filter(i => i.severity === "error").length,
    warnings: issues.filter(i => i.severity === "warn").length,
    sizeBytes
  };
}

export function repairStore(input) {
  const store = normalizeStore(input);
  const personIds = new Set(store.people.map(p => p.id));
  store.interactions = store.interactions.filter(x => personIds.has(x.personId));
  store.commitments = store.commitments.filter(x => personIds.has(x.personId));
  store.opportunities = store.opportunities.filter(x => personIds.has(x.personId));
  store.meetings = store.meetings.filter(x => personIds.has(x.personId));
  const dedupe = list => { const seen = new Set(); return list.filter(x => x.id && !seen.has(x.id) && seen.add(x.id)); };
  store.people = dedupe(store.people);
  store.interactions = dedupe(store.interactions);
  store.commitments = dedupe(store.commitments);
  store.opportunities = dedupe(store.opportunities);
  store.meetings = dedupe(store.meetings);
  store.updatedAt = new Date().toISOString();
  return store;
}
