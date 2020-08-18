export default class HtmlParser {

    stringify(el) {
        return el.outerHTML;
    }

    parse(htmlString) {
        return new DOMParser().parseFromString(htmlString, "text/html");
    }
}