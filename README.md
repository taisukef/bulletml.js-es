# bulletml.js-es ES module version of bulletml.js

JavaScript BulletML library ES module version forked from [bulletml.js](https://github.com/daishihmr/bulletml.js)

## DEMO

[独自実装](http://taisukef.github.io/bulletml.js-es/)

## FEATURES

### Runner

```js
import { bulletml } from "https://taisukef.github.io/bulletml.js-es/bulletml.js";

// setup
const bml = bulletml.buildXML("<bulletml>...</bulletml>");
const runner = bml.createRunner({
  target: playerShip, // enemy's attack target (has 'x' and 'y' property)
  createNewBullet: (bulletRunner) => { // function to be called when new bullet has been fired
    const bullet = new Bullet();
    bullet.update = () => {
      bulletRunner.update();
    };
    scene.addChild(bullet);
  }
});
runner.x = enemy.x;
runner.y = enemy.y;

enemy.update = () => {
  // every frame
  runner.x = this.x;
  runner.y = this.y;
  runner.update();
};
```

### DSL

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE bulletml SYSTEM "http://www.asahi-net.or.jp/~cs8k-cyu/bulletml/bulletml.dtd">
<bulletml xmlns="http://www.asahi-net.or.jp/~cs8k-cyu/bulletml">
    <action label="top">
        <repeat>
            <times>10</times>
            <action>
                <fire>
                    <direction type="absolute">60</direction>
                    <bullet />
                </fire>
                <wait>5</wait>
            </action>
        </repeat>
    </action>
</bulletml>
```

```js
import { bulletml } from "https://taisukef.github.io/bulletml.js-es/bulletml.js";

const d = bulletml.dsl;
const spec = new bulletml.Root({
    top: d.action([
        d.repeat(10, [
            d.fire(d.direction(60, "absolute"), d.bullet),
            d.wait(5),
        ]),
    ]),
});
```
