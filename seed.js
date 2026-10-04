const today = new Date();
const isoDays = offset => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};
const dateOnly = offset => isoDays(offset).slice(0, 10);
const hoursFromNow = (hours, minute = 0) => {
  const d = new Date();
  d.setHours(d.getHours() + hours, minute, 0, 0);
  return d.toISOString();
};

export const seedStore = {
  schemaVersion: 3,
  profile: { name: "Mi espacio", role: "Founder", focus: "Networking profesional", onboardingComplete: false, goals: ["followups", "meetings", "network"], defaultCadenceDays: 30 },
  people: [
    { id: "p_sofia", name: "Sofía Martínez", role: "Founder", company: "Lumen", city: "Buenos Aires", email: "sofia@example.com", phone: "+54 11 5555 0101", linkedin: "https://www.linkedin.com", circle: "Cercano", cadenceDays: 14, nextFollowUp: dateOnly(3), relation: "Fundadora con visión complementaria. Conversaciones frecuentes sobre producto, comunidad y crecimiento.", notes: "Quiere ver una demo temprana de ORBITA.", tags: ["Founder", "Producto", "SaaS"], createdAt: isoDays(-80) },
    { id: "p_mateo", name: "Mateo Fernández", role: "Angel Investor", company: "Northline", city: "Buenos Aires", email: "mateo@example.com", phone: "+54 11 5555 0102", linkedin: "https://www.linkedin.com", circle: "Estratégico", cadenceDays: 15, nextFollowUp: dateOnly(-1), relation: "Relación profesional de alto potencial. Interés mutuo en infraestructura de IA y founders técnicos.", notes: "Pidió que le avises cuando exista una demo navegable.", tags: ["Investor", "Fintech", "AI"], createdAt: isoDays(-120) },
    { id: "p_vale", name: "Valentina Ríos", role: "Community Lead", company: "Founders Sur", city: "Córdoba", email: "valentina@example.com", phone: "+54 351 555 0103", linkedin: "https://www.linkedin.com", circle: "Activo", cadenceDays: 21, nextFollowUp: dateOnly(8), relation: "Conectora natural del ecosistema. Suele presentar founders y operadores entre sí.", notes: "Sus miembros pierden follow-ups después de eventos.", tags: ["Community", "Events", "Network"], createdAt: isoDays(-60) },
    { id: "p_tomas", name: "Tomás Álvarez", role: "CTO", company: "Nexo Labs", city: "Montevideo", email: "tomas@example.com", phone: "+598 99 555 104", linkedin: "https://www.linkedin.com", circle: "Estratégico", cadenceDays: 20, nextFollowUp: dateOnly(6), relation: "Contacto técnico confiable para conversaciones sobre agentes, memoria y arquitectura.", notes: "Valora trazabilidad entre inferencias y evidencia.", tags: ["CTO", "Agents", "Data"], createdAt: isoDays(-100) },
    { id: "p_julieta", name: "Julieta Costa", role: "Founder", company: "Ánima", city: "Rosario", email: "julieta@example.com", phone: "+54 341 555 0105", linkedin: "https://www.linkedin.com", circle: "Activo", cadenceDays: 21, nextFollowUp: dateOnly(-3), relation: "Founder B2C con gran sensibilidad para experiencias humanas y onboarding.", notes: "Le interesó una IA que recuerde la historia de una relación sin convertirla en CRM.", tags: ["Founder", "Design", "B2C"], createdAt: isoDays(-100) },
    { id: "p_bruno", name: "Bruno Acosta", role: "Founder", company: "Kite", city: "Santiago", email: "bruno@example.com", phone: "+56 9 5555 0106", linkedin: "https://www.linkedin.com", circle: "Nuevo", cadenceDays: 30, nextFollowUp: dateOnly(12), relation: "Contacto reciente de evento con afinidad en IA aplicada y founder workflows.", notes: "Primera conversación prometedora.", tags: ["Founder", "AI", "LATAM"], createdAt: isoDays(-8) },

    { id: "p_camila", name: "Camila Torres", role: "Product Lead", company: "Nodo", city: "Buenos Aires", email: "camila@example.com", phone: "+54 11 5555 0107", linkedin: "https://www.linkedin.com", circle: "Cercano", cadenceDays: 14, nextFollowUp: dateOnly(5), relation: "Amiga del ecosistema y contraparte valiosa para validar flujos de producto y onboarding.", notes: "Muy buena para detectar fricción en productos nuevos.", tags: ["Producto", "UX", "Startup"], createdAt: isoDays(-150) },
    { id: "p_lucas", name: "Lucas Benítez", role: "Co-founder", company: "Faro AI", city: "Mendoza", email: "lucas@example.com", phone: "+54 261 555 0108", linkedin: "https://www.linkedin.com", circle: "Estratégico", cadenceDays: 18, nextFollowUp: dateOnly(2), relation: "Construye infraestructura de IA y comparte interés por agentes con memoria de largo plazo.", notes: "Puede ser buen sparring técnico para ORBITA.", tags: ["Founder", "AI", "Infra"], createdAt: isoDays(-95) },
    { id: "p_ana", name: "Ana Beltrán", role: "Partner", company: "Seedline Ventures", city: "Ciudad de México", email: "ana@example.com", phone: "+52 55 5555 0109", linkedin: "https://www.linkedin.com", circle: "Estratégico", cadenceDays: 30, nextFollowUp: dateOnly(14), relation: "Inversora enfocada en software B2B y futuro del trabajo en LATAM.", notes: "Le interesan productos con comportamiento recurrente y data moat.", tags: ["Investor", "B2B", "LATAM"], createdAt: isoDays(-170) },
    { id: "p_gonzalo", name: "Gonzalo Méndez", role: "Growth Lead", company: "Pulsar", city: "Buenos Aires", email: "gonzalo@example.com", phone: "+54 11 5555 0110", linkedin: "https://www.linkedin.com", circle: "Activo", cadenceDays: 21, nextFollowUp: dateOnly(9), relation: "Operador de growth con mucha exposición a comunidades de founders y profesionales independientes.", notes: "Puede aportar hipótesis de activación y referrals.", tags: ["Growth", "Community", "B2B"], createdAt: isoDays(-70) },
    { id: "p_micaela", name: "Micaela Suárez", role: "Founder", company: "Trama", city: "Buenos Aires", email: "micaela@example.com", phone: "+54 11 5555 0111", linkedin: "https://www.linkedin.com", circle: "Cercano", cadenceDays: 12, nextFollowUp: dateOnly(-1), relation: "Fundadora que construye comunidades profesionales y mantiene una red muy activa.", notes: "Buen perfil para probar captura manual intensiva.", tags: ["Founder", "Community", "Network"], createdAt: isoDays(-130) },
    { id: "p_rafael", name: "Rafael Lima", role: "Founder", company: "Atlas", city: "São Paulo", email: "rafael@example.com", phone: "+55 11 5555 0112", linkedin: "https://www.linkedin.com", circle: "Nuevo", cadenceDays: 30, nextFollowUp: dateOnly(18), relation: "Founder brasileño conocido recientemente. Interés en expansión regional y partnerships.", notes: "Retomar cuando ORBITA tenga versión bilingüe.", tags: ["Founder", "Brazil", "Partnerships"], createdAt: isoDays(-12) },
    { id: "p_florencia", name: "Florencia Paz", role: "People & Culture", company: "Sur Labs", city: "Córdoba", email: "florencia@example.com", phone: "+54 351 555 0113", linkedin: "https://www.linkedin.com", circle: "Activo", cadenceDays: 25, nextFollowUp: dateOnly(7), relation: "Trabaja con equipos de founders y liderazgo. Aporta una mirada humana sobre confianza y vínculos.", notes: "Interesada en cómo ORBITA separa hechos de inferencias.", tags: ["People", "Leadership", "Teams"], createdAt: isoDays(-55) },
    { id: "p_nicolas", name: "Nicolás Ferrer", role: "Founder", company: "DeltaPay", city: "Buenos Aires", email: "nicolas@example.com", phone: "+54 11 5555 0114", linkedin: "https://www.linkedin.com", circle: "Estratégico", cadenceDays: 20, nextFollowUp: dateOnly(4), relation: "Founder fintech con red extensa de bancos, startups y proveedores tecnológicos.", notes: "Podría validar valor en redes de alta densidad.", tags: ["Founder", "Fintech", "B2B"], createdAt: isoDays(-110) },
    { id: "p_martina", name: "Martina Vidal", role: "Designer", company: "Independent", city: "Buenos Aires", email: "martina@example.com", phone: "+54 11 5555 0115", linkedin: "https://www.linkedin.com", circle: "Activo", cadenceDays: 30, nextFollowUp: dateOnly(21), relation: "Diseñadora de producto con criterio fuerte en visualización de información compleja.", notes: "Puede revisar el mapa relacional y jerarquía visual.", tags: ["Design", "UX", "Data Viz"], createdAt: isoDays(-45) },
    { id: "p_sebastian", name: "Sebastián Quiroga", role: "Operator", company: "Launchpad", city: "Montevideo", email: "sebastian@example.com", phone: "+598 99 555 116", linkedin: "https://www.linkedin.com", circle: "Nuevo", cadenceDays: 30, nextFollowUp: dateOnly(16), relation: "Operador de programas para startups; conoce muchos founders en etapas tempranas.", notes: "Explorar beta post-evento con su cohorte.", tags: ["Startups", "Programs", "Network"], createdAt: isoDays(-16) }
  ],
  interactions: [
    { id: "i1", personId: "p_sofia", date: isoDays(-2), type: "Reunión", title: "Café de producto", notes: "Hablamos de onboarding y de probar ORBITA con su equipo.", source: "manual" },
    { id: "i2", personId: "p_sofia", date: isoDays(-15), type: "Mensaje", title: "Seguimiento", notes: "Compartí avances de la maqueta.", source: "manual" },
    { id: "i3", personId: "p_mateo", date: isoDays(-19), type: "Reunión", title: "Demo inicial", notes: "Pidió una actualización cuando hubiera navegación real.", source: "manual" },
    { id: "i4", personId: "p_vale", date: isoDays(-7), type: "Evento", title: "Founders Sur", notes: "Detectamos el dolor de perder contexto luego de eventos.", source: "manual" },
    { id: "i5", personId: "p_tomas", date: isoDays(-1), type: "Llamada", title: "Arquitectura de memoria", notes: "Conversamos sobre evidencia, inferencias y trazabilidad.", source: "manual" },
    { id: "i6", personId: "p_julieta", date: isoDays(-29), type: "Café", title: "Experiencia humana", notes: "Feedback muy bueno sobre evitar gamificar relaciones.", source: "manual" },
    { id: "i7", personId: "p_bruno", date: isoDays(-5), type: "Evento", title: "Primer encuentro", notes: "Nos conocimos en un evento de IA aplicada.", source: "manual" },
    { id: "i8", personId: "p_camila", date: isoDays(-4), type: "Café", title: "Revisión de onboarding", notes: "Propuso reducir decisiones iniciales y usar captura progresiva.", source: "manual" },
    { id: "i9", personId: "p_lucas", date: isoDays(-11), type: "Llamada", title: "Agentes y memoria", notes: "Intercambiamos criterios sobre memoria factual y contexto recuperable.", source: "manual" },
    { id: "i10", personId: "p_ana", date: isoDays(-24), type: "Reunión", title: "Tesis de producto", notes: "Preguntó por retención, wedge inicial y comportamiento semanal.", source: "manual" },
    { id: "i11", personId: "p_gonzalo", date: isoDays(-6), type: "Mensaje", title: "Hipótesis de referrals", notes: "Sugirió que las intros de calidad podrían ser un loop de crecimiento.", source: "manual" },
    { id: "i12", personId: "p_micaela", date: isoDays(-18), type: "Café", title: "Cómo recuerda su red", notes: "Hoy usa notas, calendario y memoria mental; pierde muchos follow-ups.", source: "manual" },
    { id: "i13", personId: "p_rafael", date: isoDays(-10), type: "Evento", title: "Encuentro regional", notes: "Hablamos de Brasil, partnerships y founders LATAM.", source: "manual" },
    { id: "i14", personId: "p_florencia", date: isoDays(-13), type: "Llamada", title: "Confianza y privacidad", notes: "Marcó que el producto debe explicar claramente hechos e inferencias.", source: "manual" },
    { id: "i15", personId: "p_nicolas", date: isoDays(-9), type: "Reunión", title: "Networking en fintech", notes: "Tiene cientos de relaciones y usa recordatorios dispersos.", source: "manual" },
    { id: "i16", personId: "p_martina", date: isoDays(-3), type: "Reunión", title: "Crítica visual", notes: "Pidió mayor legibilidad y botones más obvios sin perder densidad.", source: "manual" },
    { id: "i17", personId: "p_sebastian", date: isoDays(-14), type: "Evento", title: "Programa de startups", notes: "Vio potencial para founders que conocen mucha gente en cohorts y eventos.", source: "manual" }
  ],
  commitments: [
    { id: "c1", personId: "p_sofia", title: "Enviar intro con Mateo", dueDate: dateOnly(1), status: "open", createdAt: isoDays(-2) },
    { id: "c2", personId: "p_mateo", title: "Mandar actualización de ORBITA", dueDate: dateOnly(-2), status: "open", createdAt: isoDays(-19) },
    { id: "c3", personId: "p_tomas", title: "Compartir diagrama de memoria", dueDate: dateOnly(2), status: "open", createdAt: isoDays(-1) },
    { id: "c4", personId: "p_camila", title: "Enviar flujo de onboarding", dueDate: dateOnly(3), status: "open", createdAt: isoDays(-4) },
    { id: "c5", personId: "p_micaela", title: "Invitar a prueba manual", dueDate: dateOnly(-1), status: "open", createdAt: isoDays(-18) },
    { id: "c6", personId: "p_nicolas", title: "Compartir link de beta", dueDate: dateOnly(6), status: "open", createdAt: isoDays(-9) }
  ],
  opportunities: [
    { id: "o1", personId: "p_vale", title: "Beta cerrada con Founders Sur", stage: "Explorando", notes: "Validar con 10 founders después de eventos.", createdAt: isoDays(-7) },
    { id: "o2", personId: "p_sofia", title: "Feedback del MVP", stage: "Activa", notes: "Sesión de producto de 30 minutos.", createdAt: isoDays(-2) },
    { id: "o3", personId: "p_sebastian", title: "Prueba con cohorte Launchpad", stage: "Idea", notes: "Explorar un test manual con founders del próximo programa.", createdAt: isoDays(-14) },
    { id: "o4", personId: "p_ana", title: "Introducción a dos founders B2B", stage: "Explorando", notes: "Esperar una versión estable del MVP manual.", createdAt: isoDays(-24) },
    { id: "o5", personId: "p_martina", title: "Auditoría UX del mapa relacional", stage: "Activa", notes: "Revisar densidad, lectura y jerarquía de nodos.", createdAt: isoDays(-3) }
  ],
  meetings: [
    { id: "m1", personId: "p_sofia", title: "Revisión de ORBITA", start: hoursFromNow(5), durationMin: 45, notes: "Mostrar flujo de captura manual.", status: "upcoming" },
    { id: "m2", personId: "p_vale", title: "Explorar beta con comunidad", start: isoDays(4), durationMin: 30, notes: "Entender dinámica post-evento.", status: "upcoming" },
    { id: "m3", personId: "p_camila", title: "Criticar onboarding V0.4", start: isoDays(2), durationMin: 40, notes: "Validar claridad de captura, edición y jerarquía visual.", status: "upcoming" },
    { id: "m4", personId: "p_nicolas", title: "Caso de uso fintech", start: isoDays(7), durationMin: 30, notes: "Entender volumen y frecuencia de relaciones en fintech.", status: "upcoming" },
    { id: "m5", personId: "p_martina", title: "Revisión visual", start: isoDays(9), durationMin: 45, notes: "Auditar legibilidad, densidad y mapa de red.", status: "upcoming" }
  ],
  updatedAt: new Date().toISOString()
};
