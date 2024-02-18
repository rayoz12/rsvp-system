import { randomUUID } from "crypto";


interface Token {
    token: string;
    invitee: string;
    iat: number; // millisecond unix time
}

class TokenService {
    tokenMap = new Map<string, Token>();

    getToken(inviteeID: string) {
        const existingToken = this.tokenMap.get(inviteeID);
        if (existingToken && this.isValidToken(existingToken)) {
            return existingToken.token;
        }
        else {
            return this.issueToken(inviteeID);
        }
    }

    issueToken(invitee: string): string {
        const token: Token = {
            token: randomUUID(),
            iat: Date.now(),
            invitee
        };

        this.tokenMap.set(invitee, token);
        return token.token;
    }

    isValidToken(token: Token) {
        const exp = token.iat + (1000 * 60 * 60);
        return Date.now() < exp;
    }
}

const tokenService = new TokenService();
export default tokenService;
