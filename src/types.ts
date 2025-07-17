export type Status = 'inventory'  | 'onStage' | 'onDeck';
export type View = 'settings' | 'planning' | 'preview';

export type Position = {
    x: number;
    y: number;
};


export type CargoItem = {
    id: string;
    cargo_type_id: number;
    name: string;
    length: number;
    width: number;
    height: number;
    weight: number;
    cog: number;
    status: Status;
    position: Position;
    fs: number;
    dock: 'Front' | 'Back' | 'CoG';
}

export type Cargo = {
    items: CargoItem[];
    id?: string;
    name?: string;
    description?: string;
    owner?: string;
}

export type FuelDistribution = {
    outbd: number,
    inbd: number,
    aux: number,
    ext: number,
    fuselage: number,
};

export type MissionSettings = {
    id: string;
    name: string;
    date: string;
    departureLocation: string;
    arrivalLocation: string;
    aircraftIndex: number;
    loadmasters: number;
    loadmastersFs: number;
    passengers: number;
    etc: number;
    etcFs: number;
    cockpit: number;
    safetyGearWeight: number;
    fuelPods: boolean;
    fuelDistribution: FuelDistribution;
    crewGearWeight: number;
    notes?: string;
    aircraftId: number;
    etcWeight: number;
    foodWeight: number;
    configurationWeights: number;
}
