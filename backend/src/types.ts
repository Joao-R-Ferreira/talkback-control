export interface TalkbackConfig {
    id: string;
    name: string;
    channelType: 'ch' | 'aux';
    channelNumber: number;
}

export interface Musician {
    id: string;
    name: string;
    talkbackId: string;
}

export interface WingConnectionConfig {
    ip: string;
    port: number;
}

export interface TalkbackState {
    talkbackId: string;
    gain: number;      // 0.0 to 1.0
    isMuted: boolean;  // true = talking/active
}

export interface AppConfig {
    wing: WingConnectionConfig;
    talkbacks: TalkbackConfig[];
    musicians: Musician[];
    logoPath?: string;
    talkbackStates?: TalkbackState[];
}

export interface MeterUpdate {
    talkbackId: string;
    level: number; // 0.0 to 1.0 (or similar scale)
}
