export const paginate = <T>(arr: T[], itemsPerPage: number): T[][] => {
    return arr.reduce((acc, val, i) => {
        const idx = Math.floor(i / itemsPerPage);
        const page = acc[idx] || (acc[idx] = []);
        page.push(val);

        return acc;
    }, [] as T[][]);
};

export const parseTime = (input: string, outputType = "ms") => {
    const durationRE = /(-?(?:\d+\.?\d*|\d*\.?\d+)(?:e[-+]?\d+)?)\s*([\p{L}]*)/uig;

    const parse: any = {};

    parse.nanosecond =
        parse.ns = 1 / 1e6;

    parse["µs"] =
        parse["μs"] =
        parse.us =
        parse.microsecond = 1 / 1e3;

    parse.millisecond =
        parse.ms =
        parse[""] = 1;

    parse.second =
        parse.sec =
        parse.s = parse.ms * 1000;

    parse.minute =
        parse.min =
        parse.m = parse.s * 60;

    parse.hour =
        parse.hr =
        parse.h = parse.m * 60;

    parse.day =
        parse.d = parse.h * 24;

    parse.week =
        parse.wk =
        parse.w = parse.d * 7;

    parse.month =
        parse.mo =
        parse.b = parse.d * (365.25 / 12);

    parse.year =
        parse.yr =
        parse.y = parse.d * 365.25;

    parse["с"] =
        parse["сек"] =
        parse["секунд"] =
        parse["секунды"] = parse["second"];
    parse["м"] =
        parse["мин"] =
        parse["минут"] =
        parse["минуты"] = parse["minute"];
    parse["ч"] =
        parse["час"] =
        parse["часа"] =
        parse["часов"] = parse["hour"];
    parse["н"] =
        parse["нед"] =
        parse["недели"] =
        parse["неделя"] =
        parse["недель"] = parse["week"];
    parse["мес"] =
        parse["месяц"] =
        parse["месяца"] =
        parse["месяцев"] = parse["month"];
    parse["г"] =
        parse["год"] =
        parse["года"] =
        parse["годов"] = parse["year"];

    let result = 0;
    input = (input + "").replace(/(\d)[,_](\d)/g, "$1$2");
    input.replace(durationRE, (_, n: string, units: string | number): any => {
        units = unitRatio(units as string);
        if (units) result = (result || 0) + parseFloat(n) * units;
    });

    return result && (result / (unitRatio(outputType) || 1));

    function unitRatio(str: string): number {
        return parse[str] || parse[str.toLowerCase().replace(/s$/, "")];
    };
};