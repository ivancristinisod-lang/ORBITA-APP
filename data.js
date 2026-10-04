export const people = [
  {
    id: "sofia",
    name: "Sofía Martínez",
    initials: "SM",
    role: "Founder",
    company: "Lumen",
    city: "Buenos Aires",
    tier: "Círculo cercano",
    strength: 92,
    momentum: "Subiendo",
    lastTouch: "Hace 2 días",
    nextTouch: "Hoy · 10:30",
    relation: "Fundadora con visión complementaria. Conversaciones frecuentes sobre producto, comunidad y crecimiento.",
    tags: ["Founder", "SaaS", "Producto"],
    shared: ["IA aplicada", "Producto", "Comunidades"],
    commitments: ["Enviar intro con Mateo", "Compartir benchmark de onboarding"],
    opportunities: ["Puede aportar feedback al MVP", "Posible alianza de comunidad"],
    lastNote: "Quiere ver una demo temprana de ORBITA y entender el diferencial frente a un CRM."
  },
  {
    id: "mateo",
    name: "Mateo Fernández",
    initials: "MF",
    role: "Angel Investor",
    company: "Northline",
    city: "Buenos Aires",
    tier: "Estratégica",
    strength: 78,
    momentum: "En riesgo",
    lastTouch: "Hace 18 días",
    nextTouch: "Sugerido hoy",
    relation: "Relación profesional de alto potencial. Interés mutuo en infraestructura de IA y founders técnicos.",
    tags: ["Investor", "Fintech", "AI"],
    shared: ["Fintech", "Startups", "Infraestructura"],
    commitments: ["Mandar actualización del proyecto"],
    opportunities: ["Pedir feedback sobre narrativa inversora"],
    lastNote: "Pidió que le avises cuando exista una demo navegable."
  },
  {
    id: "valentina",
    name: "Valentina Ríos",
    initials: "VR",
    role: "Community Lead",
    company: "Founders Sur",
    city: "Córdoba",
    tier: "Activa",
    strength: 81,
    momentum: "Estable",
    lastTouch: "Hace 6 días",
    nextTouch: "En 4 días",
    relation: "Conectora natural del ecosistema. Suele presentar founders y operadores entre sí.",
    tags: ["Community", "Events", "Network"],
    shared: ["Comunidades", "Eventos", "Networking"],
    commitments: [],
    opportunities: ["Explorar beta cerrada con su comunidad"],
    lastNote: "Mencionó que sus miembros tienen problemas para sostener follow-ups después de eventos."
  },
  {
    id: "tomas",
    name: "Tomás Álvarez",
    initials: "TA",
    role: "CTO",
    company: "Nexo Labs",
    city: "Montevideo",
    tier: "Estratégica",
    strength: 74,
    momentum: "Subiendo",
    lastTouch: "Ayer",
    nextTouch: "En 8 días",
    relation: "Contacto técnico confiable. Intercambio frecuente sobre agentes, memoria y arquitectura.",
    tags: ["CTO", "Agents", "Data"],
    shared: ["Agentes", "Memoria", "Infraestructura"],
    commitments: ["Compartir diagrama de memoria"],
    opportunities: ["Revisar arquitectura del grafo relacional"],
    lastNote: "Sugirió mantener trazabilidad entre cada inferencia y su evidencia original."
  },
  {
    id: "julieta",
    name: "Julieta Costa",
    initials: "JC",
    role: "Founder",
    company: "Ánima",
    city: "Rosario",
    tier: "Activa",
    strength: 69,
    momentum: "En riesgo",
    lastTouch: "Hace 27 días",
    nextTouch: "Atrasado",
    relation: "Founder de producto B2C. Excelente sensibilidad para experiencias humanas y onboarding.",
    tags: ["Founder", "B2C", "Design"],
    shared: ["Diseño", "Psicología", "Producto"],
    commitments: ["Retomar café luego del lanzamiento"],
    opportunities: ["Test de concepto relacional"],
    lastNote: "Le interesó la idea de una IA que recuerde la historia de una relación sin convertirla en CRM."
  },
  {
    id: "nicolas",
    name: "Nicolás Vega",
    initials: "NV",
    role: "Growth Partner",
    company: "Vector",
    city: "Buenos Aires",
    tier: "Activa",
    strength: 65,
    momentum: "Estable",
    lastTouch: "Hace 9 días",
    nextTouch: "En 5 días",
    relation: "Especialista en crecimiento y distribución. Conversaciones tácticas, orientadas a experimentos.",
    tags: ["Growth", "B2B", "Go-to-market"],
    shared: ["Growth", "B2B", "Ventas"],
    commitments: [],
    opportunities: ["Diseñar experimento de activación"],
    lastNote: "Cree que el primer wow moment debe ocurrir antes de conectar cualquier integración compleja."
  },
  {
    id: "camila",
    name: "Camila Torres",
    initials: "CT",
    role: "Product Designer",
    company: "Independiente",
    city: "Buenos Aires",
    tier: "Círculo cercano",
    strength: 88,
    momentum: "Subiendo",
    lastTouch: "Hace 3 días",
    nextTouch: "En 3 días",
    relation: "Colaboradora creativa. Entiende rápido sistemas complejos y los convierte en interfaces claras.",
    tags: ["Design", "UX", "Systems"],
    shared: ["Diseño", "Interfaces", "IA"],
    commitments: ["Enviar referencias de mapas relacionales"],
    opportunities: ["Sprint visual de graph UI"],
    lastNote: "Propuso que ORBITA muestre estados relacionales con lenguaje y no solamente con números."
  },
  {
    id: "bruno",
    name: "Bruno Acosta",
    initials: "BA",
    role: "Founder",
    company: "Kite",
    city: "Santiago",
    tier: "Nueva",
    strength: 46,
    momentum: "Nueva",
    lastTouch: "Hace 4 días",
    nextTouch: "En 10 días",
    relation: "Contacto reciente de evento. Señales fuertes de afinidad en IA aplicada y founder workflows.",
    tags: ["Founder", "AI", "LatAm"],
    shared: ["IA", "Startups", "LATAM"],
    commitments: [],
    opportunities: ["Conocer mejor antes de sugerir intro"],
    lastNote: "Primera conversación en evento. Intercambiaron ideas sobre agentes personales."
  }
];

export const signals = [
  {
    type: "followup",
    priority: "Alta",
    title: "Mateo se está enfriando",
    body: "Pasaron 18 días desde el último contacto y quedó pendiente una actualización de ORBITA.",
    personId: "mateo",
    action: "Preparar mensaje",
    time: "Ahora"
  },
  {
    type: "meeting",
    priority: "Alta",
    title: "Reunión con Sofía en 42 min",
    body: "Hay 2 compromisos abiertos y una oportunidad de intro con Mateo.",
    personId: "sofia",
    action: "Ver brief",
    time: "10:30"
  },
  {
    type: "intro",
    priority: "Media",
    title: "Sofía ↔ Mateo",
    body: "Comparten interés en SaaS B2B e inversión temprana. Hay contexto suficiente para una intro relevante.",
    personId: "sofia",
    secondaryId: "mateo",
    action: "Evaluar conexión",
    time: "Hoy"
  },
  {
    type: "decay",
    priority: "Media",
    title: "Retomar con Julieta",
    body: "La relación era activa y lleva 27 días sin interacción.",
    personId: "julieta",
    action: "Recuperar contexto",
    time: "Atrasado"
  },
  {
    type: "opportunity",
    priority: "Media",
    title: "Beta con Founders Sur",
    body: "Valentina mencionó un dolor que encaja exactamente con la tesis de ORBITA.",
    personId: "valentina",
    action: "Abrir oportunidad",
    time: "Esta semana"
  },
  {
    type: "memory",
    priority: "Baja",
    title: "Compromiso pendiente con Tomás",
    body: "Prometiste compartir el diagrama de memoria relacional.",
    personId: "tomas",
    action: "Marcar para hoy",
    time: "Hace 1 día"
  }
];

export const meetings = [
  {
    id: "m1",
    personId: "sofia",
    time: "10:30",
    date: "Hoy",
    duration: "45 min",
    mode: "Google Meet",
    objective: "Mostrar dirección de ORBITA y obtener feedback de producto.",
    suggested: [
      "Empezar por el problema, no por features.",
      "Preguntar cómo hace follow-up después de eventos.",
      "Cerrar la intro con Mateo si sigue siendo relevante."
    ],
    avoid: "No presentar todavía pricing ni prometer integraciones."
  },
  {
    id: "m2",
    personId: "nicolas",
    time: "16:00",
    date: "Mañana",
    duration: "30 min",
    mode: "Presencial",
    objective: "Definir un experimento simple de activación para founders.",
    suggested: [
      "Validar el primer wow moment.",
      "Comparar onboarding manual vs. importación automática.",
      "Salir con una métrica de activación."
    ],
    avoid: "No expandir ICP fuera de founders."
  },
  {
    id: "m3",
    personId: "tomas",
    time: "11:00",
    date: "Viernes",
    duration: "60 min",
    mode: "Google Meet",
    objective: "Revisar modelo de memoria, evidencia y arquitectura de datos.",
    suggested: [
      "Llevar un modelo explícito de Interaction → Fact → Inference.",
      "Discutir trazabilidad.",
      "Separar memoria factual de inferencias."
    ],
    avoid: "No elegir infraestructura definitiva sin validar volumen."
  }
];

export const connections = [
  {
    a: "sofia",
    b: "mateo",
    score: 91,
    reason: "Sofía está explorando capital inteligente y Mateo busca founders con producto sólido.",
    common: ["SaaS B2B", "IA", "Early stage"]
  },
  {
    a: "camila",
    b: "tomas",
    score: 84,
    reason: "Camila piensa interfaces de sistemas complejos; Tomás está trabajando en memoria y agentes.",
    common: ["IA", "Systems thinking", "Producto"]
  },
  {
    a: "valentina",
    b: "bruno",
    score: 73,
    reason: "Bruno está entrando al ecosistema regional y Valentina conecta founders LATAM.",
    common: ["Founders", "LATAM", "Eventos"]
  }
];

export const memoryEvents = [
  { date: "Hoy · 09:12", personId: "sofia", channel: "Calendar", text: "ORBITA detectó una reunión próxima y generó un brief relacional." },
  { date: "Ayer · 18:40", personId: "tomas", channel: "Nota", text: "Se registró un compromiso: compartir diagrama de memoria." },
  { date: "Hace 2 días", personId: "sofia", channel: "Email", text: "Sofía pidió ver una demo temprana y conversar sobre comunidad." },
  { date: "Hace 4 días", personId: "bruno", channel: "Evento", text: "Primer encuentro. Afinidad alta en IA aplicada a founders." },
  { date: "Hace 6 días", personId: "valentina", channel: "Nota", text: "Valentina describió pérdida de follow-up después de eventos." },
  { date: "Hace 9 días", personId: "nicolas", channel: "WhatsApp · placeholder", text: "Conversación sobre activación y primer wow moment." }
];
