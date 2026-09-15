export interface OpeningWindow {
  startTime: string;
  endTime: string;
}

export interface VisitingHours {
  day: number;
  slots: OpeningWindow[];
  closed: boolean;
}

export interface Exception {
  date: Date;
  slots: OpeningWindow[];
  closed: boolean;
  reason: string;
}

export interface Schedule {
  weeklyStandard: VisitingHours[];
  exceptions: Exception[];
}