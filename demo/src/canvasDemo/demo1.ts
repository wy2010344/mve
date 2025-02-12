import { hookDraw } from "mve-dom-helper";
import { drawText, drawTextWrap, measureTextWrap } from 'wy-dom-helper'
export default function () {
  hookDraw({
    x: 150,
    y: 500,
    draw(ctx) {
      const path = new Path2D()
      path.rect(0, 0, 300, 300)
      return {
        path,
        operates: [
          { type: "stroke", width: 10, style: "green" },
          { type: "stroke", width: 10, style: "blue" },
        ],
        afterClipOperates: [
          { type: "stroke", width: 10, style: "yellow" },
          {
            type: "draw",
            callback(ctx) {
              const o = measureTextWrap(ctx, 'كانت زوجتي صامتة بشكل غريب طوال الرحلة، وبدا عليها القلق من الشر. تحدثت إليها مطمئنًا، مشيرًا إلى أن المريخيين مقيدين بالحفرة بسبب ثقلها الشديد، وفي أقصى الأحوال لا يمكنهم سوى الزحف قليلاً للخروج منها؛ لكنها أجابت بكلمات أحادية المقطع. ولولا وعدي لصاحب النزل، لكانت قد حثتني، على ما أعتقد، على البقاء في ليذرهيد تلك الليلة. أتمنى لو فعلت ذلك! أتذكر أن وجهها كان شاحبًا للغاية بينما كنا نجلس. من ناحيتي، كنت متحمسًا للغاية طوال اليوم...', {
                lineHeight: 30,
                width: 300,
                maxLines: 4,
                config: {
                  font: "20px serif"
                }
              })
              drawTextWrap(ctx, o)
            }
          }
        ]
      }
    },
  })
  hookDraw({
    x: 500,
    y: 500,
    onPointerDown(e) {
      console.log("inPath", e.inPath, 'inStroke', e.inStroke)
    },
    draw(ctx) {
      const path = new Path2D()
      path.rect(0, 0, 300, 300)
      // path.ellipse(0, 0, 500, 500, 0, 0, 0)
      return {
        path,
        operates: [
          {
            type: "stroke",
            width: 10,
            style: "red"
          },
          {
            type: "draw", callback(ctx) {
              drawText(ctx, "...中文!", "green", {
                x: 90,
                y: 90,
                config: {
                  direction: "rtl",
                  textAlign: 'left',

                  font: "30px serif"
                }
              })
              const o = measureTextWrap(ctx, 'My wife was curiously silent throughout the drive, and seemed oppressed with forebodings of evil.  I talked to her reassuringly, pointing out that the Martians were tied to the Pit by sheer heaviness, and at the utmost could but crawl a little out of it; but she answered only in monosyllables.  Had it not been for my promise to the innkeeper, she would, I think, have urged me to stay in Leatherhead that night.  Would that I had!  Her face, I remember, was very white as we parted. For my own part, I had been feverishly excited all day.', {
                lineHeight: 30,
                width: 300,
                maxLines: 4,
                config: {

                }
              })



              drawTextWrap(ctx, o)
            },
          }
          // {
          //   type: "fill",
          //   style: "green"
          // },
          // { type: "clip" },
          // {
          //   type: "stroke",
          //   width: 10,
          //   style: "blue"
          // },
          // {
          //   type: "fill",
          //   style: "orange"
          // },
          // { type: "clip" },
          // {
          //   type: "stroke",
          //   width: 10,
          //   style: "yellow"
          // },
        ]
      }
    },
  })
}