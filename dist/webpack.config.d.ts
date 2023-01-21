export const mode: string;
export namespace module {
    const rules: ({
        test: RegExp;
        loader: string;
        options: {
            inline: string;
        };
        exclude?: undefined;
        use?: undefined;
        type?: undefined;
    } | {
        test: RegExp;
        exclude: RegExp;
        use: {
            loader: string;
        };
        loader?: undefined;
        options?: undefined;
        type?: undefined;
    } | {
        test: RegExp;
        use: {
            loader: string;
        };
        loader?: undefined;
        options?: undefined;
        exclude?: undefined;
        type?: undefined;
    } | {
        test: RegExp;
        type: string;
        loader?: undefined;
        options?: undefined;
        exclude?: undefined;
        use?: undefined;
    })[];
}
export namespace output {
    const filename: string;
    const libraryTarget: string;
}
export namespace experiments {
    const outputModule: boolean;
}
export const devtool: boolean;
export namespace resolve {
    const extensions: string[];
}
