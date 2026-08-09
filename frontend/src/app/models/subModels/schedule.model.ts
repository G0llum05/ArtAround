interface OpeningWindow {
    startTime: string,
    endTime: string
}

interface VisitingHours {
    day: number,
    slots: OpeningWindow[],
    closed: boolean;
}

interface Exception {
    date: Date,
    slots: OpeningWindow[],
    closed: boolean,
    reason: string
}

export interface Schedule {
    weeklyStandard: VisitingHours[],
    exceptions: Exception[]
}