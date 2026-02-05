

type MessageHandler = (data: any) => void;

class SocketService {
    private ws: WebSocket | null = null;
    private subscribers: MessageHandler[] = [];
    private reconnectInterval: number = 3000;

    connect() {
        this.ws = new WebSocket(`ws://${window.location.hostname}:3001`);

        this.ws.onopen = () => {
            console.log('Connected to WebSocket');
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.subscribers.forEach(callback => callback(data));
            } catch (e) {
                console.error('Error parsing WS message', e);
            }
        };

        this.ws.onclose = () => {
            console.log('Disconnected. Reconnecting...');
            setTimeout(() => this.connect(), this.reconnectInterval);
        };
    }

    subscribe(callback: MessageHandler) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    sendGain(talkbackId: string, value: number) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'SET_GAIN', channelId: talkbackId, value }));
        }
    }

    sendMute(talkbackId: string, active: boolean) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'SET_MUTE', channelId: talkbackId, active }));
        }
    }

    sendFohCall(musicianId: string, musicianName: string, talkbackId: string, talkbackLabel?: string) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'FOH_CALL', musicianId, musicianName, talkbackId, talkbackLabel }));
        }
    }

    sendDismissFohCall(musicianId: string) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'FOH_DISMISS', musicianId }));
        }
    }
}

export const socketService = new SocketService();
