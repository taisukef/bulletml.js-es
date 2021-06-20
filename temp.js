import { bulletml } from "./bulletml.js";

const d = bulletml.dsl;
const spec = new bulletml.Root({
    top: d.action([
        d.repeat(10, [
            d.fire(d.direction(60, "absolute"), d.bullet),
            d.wait(5),
        ]),
    ]),
});

console.log(spec);
