module.exports.paginate = (arr = [], size = 4) => {
    return arr.reduce((acc, val, i) => {
        let idx = Math.floor(i / size);
        let page = acc[idx] || (acc[idx] = []);
        page.push(val);

        return acc;
    }, []);
};

module.exports.parseTime = (input = "", outputType = "ms") => {
    const durationRE = /(-?(?:\d+\.?\d*|\d*\.?\d+)(?:e[-+]?\d+)?)\s*([\p{L}]*)/uig;

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
        parse.b =
        parse.d * (365.25 / 12);

    parse.year =
        parse.yr =
        parse.y = parse.d * 365.25;

    parse["с"] = parse["second"];
    parse["сек"] = parse["second"];
    parse["секунд"] = parse["second"];
    parse["секунды"] = parse["second"];
    parse["м"] = parse["minute"];
    parse["мин"] = parse["minute"];
    parse["минут"] = parse["minute"];
    parse["минуты"] = parse["minute"];
    parse["ч"] = parse["hour"];
    parse["час"] = parse["hour"];
    parse["часа"] = parse["hour"];
    parse["часов"] = parse["hour"];
    parse["н"] = parse["week"];
    parse["нед"] = parse["week"];
    parse["недели"] = parse["week"];
    parse["неделя"] = parse["week"];
    parse["недель"] = parse["week"];
    parse["мес"] = parse["month"];
    parse["месяц"] = parse["month"];
    parse["месяца"] = parse["month"];
    parse["месяцев"] = parse["month"];
    parse["г"] = parse["year"];
    parse["год"] = parse["year"];
    parse["года"] = parse["year"];
    parse["годов"] = parse["year"];

    let result = 0;
    input = (input + "").replace(/(\d)[,_](\d)/g, "$1$2");
    input.replace(durationRE, (_, n, units) => {
        units = unitRatio(units);
        if (units) result = (result || 0) + parseFloat(n, 10) * units;
    });

    return result && (result / (unitRatio(outputType) || 1));

    function unitRatio(str) {
        return parse[str] || parse[str.toLowerCase().replace(/s$/, "")];
    };
};