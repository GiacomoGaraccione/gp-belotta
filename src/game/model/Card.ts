export type Suit = 'Cuori' | 'Quadri' | 'Fiori' | 'Picche'
export type Rank = '7' | '8' | '9' | 'J' | 'Q' | 'K' | '10' | 'A'
export type Player = 'Giocatore' | 'Nemico 1' | 'Compagno' | 'Nemico 2'

export interface Carta {
    suit: "Cuori" | "Quadri" | "Fiori" | "Picche";
    value: string | number;
}

export interface CartaGiocata extends Carta {
    player: Player;
}