import { fdom } from "mve-dom";

export function renderPage() {

  fdom.div({
    s_position: 'relative',
    s_width: '100vw',
    s_height: '100vh',
    s_display: 'flex',
    s_flexDirection: "column",
    s_alignItems: 'stretch',
    children() {

    }
  })
}