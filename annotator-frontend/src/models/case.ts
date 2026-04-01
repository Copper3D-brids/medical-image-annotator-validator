export interface IValidateStatus {
    no_need_for_correction: boolean;
    corrected: boolean;
    reject: boolean;
    finished: boolean;
}

interface IInput {
    contrast_pre: string;
    contrast_1: string;
    contrast_2: string;
    contrast_3: string;
    contrast_4: string;
    registration_pre: string;
    registration_1: string;
    registration_2: string;
    registration_3: string;
    registration_4: string;
    model_predicted_nii?: string;
    researcher_manual_nii?: string;
}

interface IOutput {
    mask_meta_json_path: string;
    mask_meta_json_size: string | number;
    clinician_validated_nii_path?: string;
    clinician_validated_nii_size?: string | number;
    mask_glb_path: string;
    mask_glb_size: string | number;
    validate_json?: IValidateStatus;
}

export interface IDetails {
    id: string | number;
    name: string;
    assay_uuid: string;
    input: IInput;
    output: IOutput;
    masked?: boolean;
    file_paths?: {
        registration_nrrd_paths: string[];
        origin_nrrd_paths: string[];
        segmentation_manual_mask_paths: string[];
    };
}

export interface INrrdCaseNames {
    names: string[];
    details: Array<IDetails>;
    [proName: string]: any;
}

export interface ICaseUrls {
    nrrdUrls: Array<string>;
    jsonUrl?: string;
}

export interface ICaseRegUrls {
    nrrdUrls: Array<string>;
}

export interface ICaseDetails {
    currentCaseName: string;
    currentCaseId: string;
    details: Array<IDetails>;
    maskNrrd: string;
}

export interface ILoadUrls {
    [proName: string]: any;
}
