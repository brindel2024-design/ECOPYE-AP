export const PROVIDERS: Record<string, { name: string; type: string; min: number; max: number }> = {
  mobilis:         { name: 'Mobilis',         type: 'mobile',  min: 100,   max: 10000  },
  djezzy:          { name: 'Djezzy',          type: 'mobile',  min: 100,   max: 10000  },
  ooredoo:         { name: 'Ooredoo',         type: 'mobile',  min: 100,   max: 10000  },
  sonelgaz:        { name: 'Sonelgaz',        type: 'energy',  min: 500,   max: 200000 },
  seaal:           { name: 'SEAAL (Eau)',      type: 'water',   min: 200,   max: 100000 },
  algerie_poste:   { name: 'Algérie Poste',   type: 'postal',  min: 100,   max: 50000  },
  algerie_telecom: { name: 'Algérie Télécom', type: 'telecom', min: 200,   max: 20000  },
}
