import { Invitee } from "./../db/db.js";

export enum ResponseState {
    COMPLETE = "COMPLETE",
    PARTIAL = "PARTIAL",
    INCOMPLETE = "INCOMPLETE"
}

export function getResponseState(invitee: Invitee) {
    const responses = [];
    if (invitee.indianResponseEnabled) {
        responses.push(invitee.indianResponse)
    }
    if (invitee.nuptialsResponseEnabled) {
        responses.push(invitee.nuptialsResponse)
    }
    if (invitee.receptionResponseEnabled) {
        responses.push(invitee.receptionResponse)
    }
    const isComplete = responses.every(it => it !== null);
    const isPartial = responses.some(it => it === null);
    const isIncomplete = responses.every(it => it === null);

    if (isComplete) {
        return ResponseState.COMPLETE;
    }
    else if (isIncomplete) {
        return ResponseState.INCOMPLETE;
    }
    else if (isPartial) {
        return ResponseState.PARTIAL;
    }
    else {
        throw new Error("Unknown State");
    }
}