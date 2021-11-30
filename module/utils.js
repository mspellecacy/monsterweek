export class Utils {

    static moveDescriptionToggler(elem, actor, itemId) {
        const item = actor.items.get(itemId);

        // Toggle summary
        if (elem.hasClass("item-expanded")) {
            let summary = elem.children(".item-summary");
            summary.slideUp(200, () => summary.remove());
        } else {
            const div = $(`<div class="item-summary">${item.data.data.description}</div>`);
            elem.append(div.hide());
            div.slideDown(200);
        }
        elem.toggleClass("item-expanded");
    }
}