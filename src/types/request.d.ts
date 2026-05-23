import { Token } from 'src/models/Token.model';
import { User } from 'src/models/User.model';

declare module 'express-serve-static-core' {
    export interface Request {
        accessToken?: string;
        token: Token;
        user?: User;
        session: {
            set(key: string, value: any): Promise<void>;
            get(key?: string): Promise<any>;
            remove(key: string): Promise<void>;
            clear(): Promise<void>;
        }
    }
}
