import "./style.css";
import Doodlebot from "../release/doodlebot/Doodlebot";
import LineArrayFollowing from "../release/LineArrayFollowing";
import { getBLEDeviceWithUartService } from "../release/doodlebot/ble";
import { type SensorKey, sensor } from "../release/doodlebot/enums";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
      <button id="start">
          Connect
      </button>
  </div>
  <div>
      <button id="calibrate">
          Calibrate
      </button>
  </div>
  <div>
      <button id="lineFollow">
          Follow Line
      </button>
  </div>
`;

let doodlebot: Doodlebot;

const calibrate = async (element: HTMLButtonElement) =>
  element.addEventListener("click", async () => {
    doodlebot.sendBLECommand("m", "c");
  });

const setup = async (element: HTMLButtonElement) =>
  element.addEventListener("click", async () => {
    const { bluetooth } = window.navigator;
    const result = await getBLEDeviceWithUartService(bluetooth);
    if ("error" in result) {
      console.error("Failed to get device:", result.error);
      return;
    }

    let topLevelDomain = result.device.name ?? "";
    if (!topLevelDomain.endsWith(".direct.mitlivinglab.org"))
      topLevelDomain += ".direct.mitlivinglab.org";

    doodlebot = new Doodlebot();
    doodlebot.topLevelDomain.resolve(topLevelDomain);
    doodlebot.bleDevice.resolve(result);

    for (const key of Object.keys(sensor)) {
      doodlebot.disableSensor(key as SensorKey); // don't await
    }
    window.addEventListener("pagehide", () => {
      for (const key of Object.keys(sensor)) {
        doodlebot.disableSensor(key as SensorKey); // don't await
      }
    });
  });

const lineFollow = async (element: HTMLButtonElement) =>
  element.addEventListener("click", async () => {
    console.log(await doodlebot.getSensorReading("line"));
    const lineFollower = new LineArrayFollowing(
      2, // Kp
      200, // base speed
      500, // max speed
      0, // min speed
      doodlebot.sendBLECommand.bind(doodlebot),
      doodlebot.getSensorReading.bind(doodlebot)
    );

    lineFollower.drivingStarted = true;
    lineFollower.keepDriving = true;
    await lineFollower.loop();

    while (true) {
      const status = await lineFollower.getLineStatus();
      switch (status) {
        case "left of line":
          await lineFollower.turnRight();
          break;
        case "right of line":
          await lineFollower.turnLeft();
          break;
        case "on the line":
          await lineFollower.goStraight();
          break;
        case "off the line":
          await doodlebot.motorCommand("stop");
          break;
      }
    }
  });

setup(document.querySelector<HTMLButtonElement>("#start")!);
calibrate(document.querySelector<HTMLButtonElement>("#calibrate")!);
lineFollow(document.querySelector<HTMLButtonElement>("#lineFollow")!);
