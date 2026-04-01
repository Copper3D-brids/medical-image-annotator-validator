export interface IToolConfig {
    user_info: {
        uuid: string;
    };
    assay_info: {
        uuid: string;
        name: string;
        cohorts: string[];
        datasets: string[];
    };
    system: {
        minio: {
            public_path: string;
        };
    };
}

export interface IToolConfigResponse {
    status: string;
    assay_id: number;
}

export type ToolConfigStep = 'resolving_inputs' | 'copy_nii' | 'convert_gltf' | 'create_validate_json' | 'update_db';

export interface ISSEProgressEvent {
    step: ToolConfigStep;
    case: string;
    total_cases: number;
    current: number;
}

export interface ISSECompleteEvent {
    status: string;
    assay_id: number;
}

export interface ISSEErrorEvent {
    step: string;
    summary: string;
    detail: string;
}

export interface IAuth {
    user_uuid: string;
    assay_uuid: string;
}

export interface IKeyboardSettings {
    draw: string;
    undo: string;
    redo: string;
    contrast: string[];
    crosshair: string;
    mouseWheel: "Scroll:Zoom" | "Scroll:Slice" | string;
    [key: string]: any;
}

export interface IParams {
    params: unknown;
    responseType?: string;
}

export interface IRequests {
    url: string;
    params: any;
}
