export const mode: string;
export namespace module {
    const rules: ({
        test: RegExp;
        type: string;
        loader?: undefined;
        options?: undefined;
        exclude?: undefined;
        use?: undefined;
    } | {
        test: RegExp;
        loader: string;
        options: {
            inline: string;
        };
        type?: undefined;
        exclude?: undefined;
        use?: undefined;
    } | {
        test: RegExp;
        exclude: RegExp;
        use: {
            loader: string;
        };
        type?: undefined;
        loader?: undefined;
        options?: undefined;
    } | {
        test: RegExp;
        use: {
            loader: string;
        };
        type?: undefined;
        loader?: undefined;
        options?: undefined;
        exclude?: undefined;
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
