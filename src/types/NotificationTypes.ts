import type { IPessoa } from "../models/Pessoa";

export interface AniversarioFiltrado {
    name: string;
    date: Date;
}

export interface AniversariosPorDiaList {
    intervalo: number;
    aniversarios: AniversarioFiltrado[];
}

export interface UsuarioComAniversarios {
    user: IPessoa;
    aniversarios: AniversariosPorDiaList[];
}

export interface INotificationProvider {
    send(usuarios: UsuarioComAniversarios[]): Promise<void>;
}