import { NJO } from "../mve-DOM/index";
import { newArticle } from "../mve/childrenBuilder";
import { topTitleResizeForm } from "./window/form";

export=topTitleResizeForm(function(me,p,r){

  const article=newArticle<NJO,Node>()
  .append("")
  return {
    title:"mve知识",
    element:{
      type:"div",
      children:article.out
    }
  }
})