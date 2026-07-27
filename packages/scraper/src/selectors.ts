import { SelectorGroup } from "./types.js";

export const selectorGroups = {
  pageReady: {
    groupName: "pageReady",
    candidates: [
      { name: "body", selector: "body", confidence: "high" },
      { name: "main", selector: "main", confidence: "medium" }
    ]
  },
  categoryBlocks: {
    groupName: "categoryBlocks",
    candidates: [
      { name: "section", selector: "section", confidence: "medium" },
      { name: "article", selector: "article", confidence: "medium" },
      { name: "generic-card", selector: "div", confidence: "low" }
    ]
  },
  cpuCategory: {
    groupName: "cpuCategory",
    candidates: [
      { name: "cpu-text", selector: "text=/CPU|islemci|processor/i", confidence: "medium" },
      { name: "category-block", selector: "section,article,div", confidence: "low" }
    ]
  },
  productCards: {
    groupName: "productCards",
    candidates: [
      { name: "list-items", selector: "li", confidence: "medium" },
      { name: "articles", selector: "article", confidence: "medium" },
      { name: "priced-divs", selector: "div", confidence: "low" }
    ]
  },
  productName: {
    groupName: "productName",
    candidates: [
      { name: "title", selector: "[title]", confidence: "medium" },
      { name: "heading", selector: "h3,h4,h5", confidence: "medium" },
      { name: "text", selector: "span,p,a", confidence: "low" }
    ]
  },
  productPrice: {
    groupName: "productPrice",
    candidates: [
      { name: "price-class", selector: "[class*=price],[class*=fiyat]", confidence: "medium" },
      { name: "text", selector: "span,div,p", confidence: "low" }
    ]
  },
  selectButton: {
    groupName: "selectButton",
    candidates: [
      { name: "button", selector: "button", confidence: "medium" },
      { name: "role-button", selector: "[role=button]", confidence: "medium" },
      { name: "link-button", selector: "a", confidence: "low" }
    ]
  },
  motherboardCategory: {
    groupName: "motherboardCategory",
    candidates: [
      { name: "motherboard-text", selector: "text=/anakart|motherboard|mainboard/i", confidence: "medium" },
      { name: "category-block", selector: "section,article,div", confidence: "low" }
    ]
  },
  totalPrice: {
    groupName: "totalPrice",
    candidates: [
      { name: "total-class", selector: "[class*=total],[class*=toplam]", confidence: "medium" },
      { name: "summary", selector: "aside,section,div", confidence: "low" }
    ]
  }
} satisfies Record<string, SelectorGroup>;
