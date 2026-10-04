import { seedStore } from "./seed.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeStore, relationshipState, computeSignals, buildMeetingBrief, peopleToCSV,
  reportToMarkdown, daysBetween, parseContactsCSV, auditStore, repairStore, buildRelationalOpportunities, SCHEMA_VERSION
} from "./core.js";
import { canonicalRelationalClaim, hashRelationalClaim, buildSolanaMemoPayload, solanaExplorerUrl } from "./solana.js";

const fixedNow = new Date("2026-08-15T12:00:00-03:00");
const base = normalizeStore({
  profile:{name:"Test",onboardingComplete:true,goals:["followups"],defaultCadenceDays:30},
  people:[{id:"p1",name:"Ana Test",circle:"Estratégico",cadenceDays:10,relation:"Contexto",tags:["IA"]}],
  interactions:[{id:"i1",personId:"p1",date:"2026-07-25T12:00:00-03:00",type:"Reunión",title:"Última",notes:"Nota"}],
  commitments:[{id:"c1",personId:"p1",title:"Enviar deck",dueDate:"2026-08-14",status:"open"}],
  opportunities:[{id:"o1",personId:"p1",title:"Beta",stage:"Activa",notes:""}],
  meetings:[{id:"m1",personId:"p1",title:"Café",start:"2026-08-15T15:00:00-03:00",durationMin:30,status:"upcoming",notes:"Preparar"}]
});

test("normalization creates canonical V3 store",()=>{
  assert.equal(SCHEMA_VERSION,3);
  assert.equal(base.schemaVersion,3);
  assert.equal(base.people.length,1);
  assert.equal(base.interactions[0].source,"manual");
  assert.equal(base.profile.onboardingComplete,true);
  assert.equal(base.profile.defaultCadenceDays,30);
});
test("date-only arithmetic is stable",()=>{ assert.equal(daysBetween("2026-08-14","2026-08-15"),1); });
test("relationship falls out of cadence",()=>{ const rel=relationshipState(base,base.people[0],fixedNow); assert.equal(rel.tone,"risk"); assert.equal(rel.label,"Enfriándose"); });
test("signals prioritize overdue commitment and imminent meeting",()=>{ const signals=computeSignals(base,fixedNow); assert.ok(signals.some(s=>s.type==="commitment"&&s.tone==="risk")); assert.ok(signals.some(s=>s.type==="meeting")); assert.equal(signals[0].type,"commitment"); });
test("meeting brief uses factual context",()=>{ const brief=buildMeetingBrief(base,"m1"); assert.equal(brief.person.name,"Ana Test"); assert.equal(brief.commitments[0].title,"Enviar deck"); assert.equal(brief.suggestedFocus,"Enviar deck"); });
test("CSV export includes people",()=>{ const csv=peopleToCSV(base); assert.match(csv,/Ana Test/); assert.match(csv,/Estratégico/); });
test("Markdown report includes relationship context",()=>{ const md=reportToMarkdown(base,fixedNow); assert.match(md,/ORBITA/); assert.match(md,/Ana Test/); assert.match(md,/Contexto/); });
test("empty store remains valid",()=>{ const empty=normalizeStore({}); assert.deepEqual(empty.people,[]); assert.deepEqual(empty.meetings,[]); assert.equal(empty.profile.onboardingComplete,false); });
test("CSV contact import parses Spanish headers and quoted commas",()=>{ const rows=parseContactsCSV("Nombre,Rol,Empresa,Tags\n\"Ana Pérez\",Founder,Acme,IA|SaaS"); assert.equal(rows.length,1); assert.equal(rows[0].name,"Ana Pérez"); assert.deepEqual(rows[0].tags,["IA","SaaS"]); });
test("enriched demo contains 16 people",()=>{ assert.equal(seedStore.people.length,16); assert.ok(seedStore.interactions.length>=16); });
test("audit detects orphaned records",()=>{ const broken=normalizeStore({...base,interactions:[...base.interactions,{id:"orphan",personId:"missing",date:new Date().toISOString(),title:"X"}]}); const audit=auditStore(broken); assert.equal(audit.ok,false); assert.ok(audit.issues.some(i=>i.code==="orphan")); });
test("repair removes orphaned records",()=>{ const broken=normalizeStore({...base,commitments:[...base.commitments,{id:"cx",personId:"missing",title:"X"}]}); const repaired=repairStore(broken); assert.equal(repaired.commitments.some(c=>c.id==="cx"),false); assert.equal(auditStore(repaired).ok,true); });


test("normalization persists the founder current goal",()=>{
  const normalized=normalizeStore({...base,profile:{...base.profile,currentGoal:"Estoy levantando una ronda pre-seed"}});
  assert.equal(normalized.profile.currentGoal,"Estoy levantando una ronda pre-seed");
});

test("fundraising goal ranks the prepared demo relationships",()=>{
  const results=buildRelationalOpportunities(seedStore,"Estoy levantando una ronda pre-seed",new Date());
  assert.deepEqual(results.slice(0,3).map(item=>item.contact_id),["p_mateo","p_ana","p_vale"]);
});

test("fundraising demo scores remain calibrated and explainable",()=>{
  const results=buildRelationalOpportunities(seedStore,"Estoy levantando una ronda pre-seed",new Date());
  assert.deepEqual(results.slice(0,3).map(item=>item.relevance_score),[70,67,57]);
  assert.ok(results.every(item=>item.evidence.length>0));
  assert.ok(results.every(item=>item.inference.startsWith("Inferencia:")));
  assert.ok(results.every(item=>item.suggested_action.length>20));
});

test("unrelated goals do not fabricate relational opportunities",()=>{
  assert.deepEqual(buildRelationalOpportunities(seedStore,"Quiero aprender guitarra",new Date()),[]);
});

test("relational evidence is traceable to recorded context",()=>{
  const [first]=buildRelationalOpportunities(seedStore,"Necesito encontrar inversores",new Date());
  assert.equal(first.contact_id,"p_mateo");
  assert.ok(first.evidence.some(item=>["perfil","contexto","interacción","oportunidad","compromiso"].includes(item.source)));
  assert.ok(["alta","media","baja"].includes(first.confidence));
});

test("Solana attestation adapter is deterministic and privacy-minimal",async()=>{
  const claim=canonicalRelationalClaim({actorId:"orbita:alpha",targetId:"orbita:beta"});
  const digestA=await hashRelationalClaim(claim);
  const digestB=await hashRelationalClaim({...claim});
  assert.equal(digestA,digestB);
  assert.match(digestA,/^[a-f0-9]{64}$/);
  const memo=buildSolanaMemoPayload(digestA);
  assert.match(memo,/^orbita:v1:introduction:introduction:[a-f0-9]{64}$/);
  assert.doesNotMatch(memo,/ivan|email|phone|goal|note/i);
  assert.equal(solanaExplorerUrl("demoSignature"),"https://explorer.solana.com/tx/demoSignature?cluster=devnet");
});
