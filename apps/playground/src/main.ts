import "./style.css";
import "./window.d.ts";
import "./page";
import { autoRun } from "./services/astraea-client";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
    app.innerHTML = "<app-layout></app-layout>";
}

void autoRun();
