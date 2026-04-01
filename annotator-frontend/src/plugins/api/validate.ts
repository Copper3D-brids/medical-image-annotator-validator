import http from "./client";

export interface IValidateStatus {
  no_need_for_correction: boolean;
  corrected: boolean;
  reject: boolean;
  finished: boolean;
}

export async function getValidateStatus(caseId: number | string): Promise<IValidateStatus> {
  return http.get<IValidateStatus>(`/validate-status/${caseId}`);
}

export async function updateValidateStatus(caseId: number | string, action: string): Promise<void> {
  return http.post(`/validate/${caseId}`, { action });
}
