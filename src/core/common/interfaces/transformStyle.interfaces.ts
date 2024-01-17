export interface ITransformStyle {
    transform: string;
    WebkitTransform: string;
    MozTransform: string;
    msTransform: string;
    OTransform: string;
    width: string;
    height: string;
    position: `absolute` | `relative`;
}

export interface ITopLeftStyle {
    top: string;
    left: string;
    width: string;
    height: string;
    position: `absolute`;
}

export interface ITopRightStyle {
    top: string;
    right: string;
    width: string;
    height: string;
    position: string;
}
