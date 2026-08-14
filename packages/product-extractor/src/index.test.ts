import test from "node:test";
import assert from "node:assert/strict";
import {
  type AiProductFeatureExtractor,
  extractProductFeatureProfile,
} from "./index.js";

const productHtml = `
  <html>
    <head><title>Example monitor product page</title></head>
    <body>
      <h1>Example Display Office Monitor</h1>
      <table>
        <tr><th>Marka</th><td>Example Display</td></tr>
        <tr><th>Ekran boyutu</th><td>24 inc</td></tr>
      </table>
    </body>
  </html>
`;

test("ULTEF: AI extractor output creates a valid ProductFeatureProfile", async () => {
  const aiExtractor: AiProductFeatureExtractor = async (input) => {
    assert.match(input.htmlText, /Example Display Office Monitor/);
    assert.equal(input.locale, "tr-TR");

    return {
      productCategory: "monitor",
      identity: {
        title: "Example Display Office Monitor",
        brand: "Example Display",
        model: "ED-24",
      },
      features: [
        {
          label: "Ekran boyutu",
          value: 24,
          unit: "inc",
        },
        {
          label: "Cozunurluk",
          value: "1920x1080",
        },
      ],
    };
  };

  const result = await extractProductFeatureProfile({
    url: "https://example.test/products/monitor-24",
    html: productHtml,
    fetchedAt: "2026-08-13T00:00:00.000Z",
    aiExtractor,
  });

  assert.equal(result.extractionMode, "ai");
  assert.equal(result.validation.valid, true);
  assert.equal(result.profile.productCategory, "monitor");
  assert.equal(result.profile.sourceMode, "productExtractor");
  assert.equal(result.profile.readiness, "readyForSpecification");
  assert.ok(result.profile.evidence[0]);
  assert.equal(result.profile.evidence[0].sourceType, "productPage");
  assert.equal(result.profile.features.length, 2);
});

test("ULTEF: AI extracted brand/model fields are kept out of clauses", async () => {
  const aiExtractor: AiProductFeatureExtractor = async () => ({
    productCategory: "printer",
    identity: {
      title: "Example Brand X123 Printer",
      brand: "Example Brand",
      model: "X123",
    },
    features: [
      {
        label: "Marka",
        value: "Example Brand",
      },
      {
        label: "Model",
        value: "X123",
      },
      {
        label: "Otomatik cift tarafli baski",
        value: true,
      },
    ],
  });

  const result = await extractProductFeatureProfile({
    url: "https://example.test/products/printer-x123",
    html: productHtml,
    fetchedAt: "2026-08-13T00:00:00.000Z",
    aiExtractor,
  });

  assert.equal(result.validation.valid, true);
  assert.equal(
    result.profile.features.find((feature) => feature.label === "Marka")
      ?.clauseEligible,
    false,
  );
  assert.equal(
    result.profile.features.find((feature) => feature.label === "Model")
      ?.clauseEligible,
    false,
  );
  assert.equal(
    result.profile.features.find((feature) =>
      feature.label.includes("cift tarafli"),
    )?.clauseEligible,
    true,
  );
});

test("ULTEF: commercial and marketing features are excluded from specification clauses", async () => {
  const aiExtractor: AiProductFeatureExtractor = async () => ({
    productCategory: "monitor",
    identity: {
      title: "Example Display Office Monitor",
      brand: "Example Display",
      model: "ED-24",
    },
    features: [
      {
        label: "Yenileme hizi",
        value: 165,
        unit: "hz",
        specSuitability: {
          featureClass: "technicalRequired",
          decision: "include",
          reason: "Observable display performance value.",
          riskLevel: "low",
          suggestedClauseText:
            "Monitorun ekran yenileme hizi en az 144 Hz olmalidir.",
          confidence: 0.86,
        },
      },
      {
        label: "Sepette indirim",
        value: "%10",
      },
      {
        label: "Oyuncular icin mukemmel deneyim",
        value: true,
      },
    ],
  });

  const result = await extractProductFeatureProfile({
    url: "https://example.test/products/monitor-165",
    html: productHtml,
    fetchedAt: "2026-08-13T00:00:00.000Z",
    aiExtractor,
  });

  assert.equal(result.validation.valid, true);
  assert.equal(
    result.profile.features.find((feature) => feature.label === "Yenileme hizi")
      ?.clauseEligible,
    true,
  );
  assert.equal(
    result.profile.features.find((feature) => feature.label === "Sepette indirim")
      ?.specSuitability?.featureClass,
    "commercial",
  );
  assert.equal(
    result.profile.features.find((feature) =>
      feature.label.includes("mukemmel"),
    )?.clauseEligible,
    false,
  );
});

test("ULTEF: extractor falls back to structured page data without AI", async () => {
  const result = await extractProductFeatureProfile({
    url: "https://example.test/products/monitor-24",
    html: productHtml,
    fetchedAt: "2026-08-13T00:00:00.000Z",
  });

  assert.equal(result.extractionMode, "structuredFallback");
  assert.equal(result.validation.valid, true);
  assert.equal(result.profile.productCategory, "monitor");
  assert.equal(
    result.profile.features.some((feature) => feature.label === "Ekran boyutu"),
    true,
  );
});

test("ULTEF: extractor keeps structured output when AI extraction times out", async () => {
  const aiExtractor: AiProductFeatureExtractor = async () => {
    throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
  };

  const result = await extractProductFeatureProfile({
    url: "https://example.test/products/monitor-24",
    html: productHtml,
    fetchedAt: "2026-08-13T00:00:00.000Z",
    aiExtractor,
  });

  assert.equal(result.extractionMode, "structuredFallback");
  assert.equal(result.validation.valid, true);
  assert.equal(result.profile.readiness, "readyForSpecification");
  assert.equal(
    result.profile.features.some((feature) => feature.label === "Ekran boyutu"),
    true,
  );
  assert.equal(result.profile.gaps[0]?.code, "ai_extraction_failed");
  assert.match(result.profile.gaps[0]?.message ?? "", /timeout/i);
});

test("ULTEF: Hepsiburada redux product state extracts real product variants", async () => {
  const html = `
    <html>
      <head><title>Apple MacBook Neo A18 Pro 8GB 256GB SSD macOS 13 Fiyatı</title></head>
      <body>
        <script type="mime/invalid" id="reduxStore">
          {
            "productState": {
              "product": {
                "brand": "Apple",
                "sku": "HBCV0000D6UMYG",
                "barcode": "0195950851014",
                "name": "MacBook Neo A18 Pro 8GB 256GB SSD macOS 13\\" Taşınabilir Bilgisayar Gümüş MHFA4TU/A",
                "categories": [
                  {
                    "categoryName": "Bilgisayar Sistemleri ve Ekipmanları",
                    "breadcrumbTitle": "Bilgisayar Sistemleri ve Ekipmanları",
                    "urlKeyword": "bilgisayar-sistemleri-ve-ekipmanlari"
                  },
                  {
                    "categoryName": "Dizüstü Bilgisayar Laptop",
                    "breadcrumbTitle": "Laptop",
                    "urlKeyword": "laptop-notebook-dizustu-bilgisayarlar"
                  }
                ],
                "variants": [
                  {
                    "sku": "HBCV0000D6UMYG",
                    "properties": [
                      {
                        "name": "SSD Kapasitesi",
                        "displayName": "SSD Kapasitesi",
                        "valueObject": { "actualValue": "256 GB" }
                      },
                      {
                        "name": "Ram (Sistem Belleği)",
                        "displayName": "Ram (Sistem Belleği)",
                        "valueObject": { "actualValue": "8 GB" }
                      }
                    ]
                  }
                ]
              }
            }
          }
        </script>
        <footer>Monitör Ekran Kartı Mouse</footer>
      </body>
    </html>
  `;

  const result = await extractProductFeatureProfile({
    url: "https://www.hepsiburada.com/example-p-HBCV0000D6UMYG",
    html,
    fetchedAt: "2026-08-13T00:00:00.000Z",
  });

  assert.equal(result.extractionMode, "structuredFallback");
  assert.equal(result.validation.valid, true);
  assert.equal(result.profile.productCategory, "notebookComputer");
  assert.equal(result.profile.identity.brand, "Apple");
  assert.equal(result.profile.identity.model, "HBCV0000D6UMYG");
  assert.equal(result.profile.features.length, 2);
  assert.deepEqual(
    result.profile.features.map((feature) => ({
      label: feature.label,
      value: feature.value,
      unit: feature.unit,
    })),
    [
      { label: "SSD Kapasitesi", value: 256, unit: "gb" },
      { label: "Ram (Sistem Belleği)", value: 8, unit: "gb" },
    ],
  );
});

test("ULTEF: notebook cooler page does not turn commercial fields into clauses", async () => {
  const html = `
    <html>
      <head><title>Frisby FNC-5260ST 6 Fanli Sessiz Aluminyum Izgara Notebook Sogutucu Stand 17 Uyumlu</title></head>
      <body>
        <h1>Frisby FNC-5260ST 6 Fanli Sessiz Aluminyum Izgara Notebook Sogutucu Stand 17 Uyumlu</h1>
        <table>
          <tr><th>Fan sayisi</th><td>6</td></tr>
          <tr><th>Notebook uyumlulugu</th><td>17 inc</td></tr>
          <tr><th>Mensei</th><td>CN - Cin Halk Cumhuriyeti</td></tr>
          <tr><th>Yurt Disi Satis</th><td>Yok</td></tr>
          <tr><th>Stok Adedi</th><td>20 adetten az</td></tr>
        </table>
      </body>
    </html>
  `;

  const result = await extractProductFeatureProfile({
    url: "https://www.hepsiburada.com/frisby-notebook-sogutucu-p-HBC00009NBEP6",
    html,
    fetchedAt: "2026-08-13T00:00:00.000Z",
  });

  assert.equal(result.validation.valid, true);
  assert.equal(result.profile.productCategory, "other");
  assert.equal(
    result.profile.features.find((feature) => feature.label === "Fan sayisi")
      ?.clauseEligible,
    true,
  );
  assert.equal(
    result.profile.features.find((feature) => feature.label === "Mensei")
      ?.clauseEligible,
    false,
  );
  assert.equal(
    result.profile.features.find((feature) => feature.label === "Yurt Disi Satis")
      ?.clauseEligible,
    false,
  );
  assert.equal(
    result.profile.features.find((feature) => feature.label === "Stok Adedi")
      ?.clauseEligible,
    false,
  );
});

test("ULTEF: tablet case variant selector does not become a specification clause", async () => {
  const html = `
    <html>
      <head><title>Samsung Galaxy Tab A9 Plus 11 Inc Tablet Kilifi Smart Standli Kapakli</title></head>
      <body>
        <h1>Samsung Galaxy Tab A9 Plus 11 Inc Tablet Kilifi Smart Standli Pu Deri Pc Yari Saydam Hafif Slim Kapakli SM-X210</h1>
        <table>
          <tr><th>Seçenek</th><td>Samsung Galaxy Tab A9 Plus 11İnç</td></tr>
          <tr><th>Renk</th><td>Siyah</td></tr>
        </table>
      </body>
    </html>
  `;

  const result = await extractProductFeatureProfile({
    url: "https://www.hepsiburada.com/tablet-kilifi-p-HBCV00005TBR33",
    html,
    fetchedAt: "2026-08-13T00:00:00.000Z",
  });

  assert.equal(result.validation.valid, true);
  assert.equal(result.profile.productCategory, "other");
  assert.equal(
    result.profile.features.find((feature) => feature.label === "Seçenek")
      ?.clauseEligible,
    false,
  );
  assert.equal(
    result.profile.features.find((feature) => feature.label === "Seçenek")
      ?.specSuitability?.decision,
    "review",
  );
});

test("ULTEF: Hepsiburada all-in-one product info becomes compact AI evidence", async () => {
  const hugeFooter = "Kampanya Sepet Stok ".repeat(20_000);
  const html = `
    <html>
      <head><title>Lenovo Ideacentre Intel Core Ultra 5 226V 16GB 512GB SSD Fiyatı</title></head>
      <body>
        <script type="mime/invalid" id="reduxStore">
          {
            "productState": {
              "product": {
                "brand": "Lenovo",
                "sku": "HBCV0000FC0LUS",
                "barcode": "0199274928353",
                "name": "Ideacentre Intel Core Ultra 5 226V 16GB 512GB SSD Freedos 27\\" FHD All In One Bilgisayar F0JW000HTR",
                "categories": [
                  { "categoryName": "Bilgisayar Sistemleri ve Ekipmanları" },
                  { "categoryName": "Bilgisayarlar" },
                  { "categoryName": "Monitör PC (All-in-One)" }
                ],
                "variants": [
                  {
                    "sku": "HBCV0000FC0LUS",
                    "properties": [
                      {
                        "name": "Renk",
                        "displayName": "Renk",
                        "valueObject": { "actualValue": "Gri" }
                      }
                    ]
                  }
                ]
              }
            }
          }
        </script>
        <h2>Ürün Bilgileri</h2>
        <div><div>Ekran Boyutu</div><div>27 inç</div></div>
        <div><div>SSD Kapasitesi</div><div>512 GB</div></div>
        <div><div>Ram (Sistem Belleği)</div><div>16 GB</div></div>
        <div><div>Çözünürlük (max)</div><div>1920 x 1080</div></div>
        <footer>${hugeFooter}</footer>
      </body>
    </html>
  `;
  let aiText = "";
  const aiExtractor: AiProductFeatureExtractor = async (input) => {
    aiText = input.htmlText;
    return {
      productCategory: "desktopComputer",
      identity: { title: "Lenovo Ideacentre", brand: "Lenovo" },
      features: [
        { label: "Ekran Boyutu", value: 27, unit: "inc" },
        { label: "SSD Kapasitesi", value: 512, unit: "gb" },
      ],
    };
  };

  const result = await extractProductFeatureProfile({
    url: "https://www.hepsiburada.com/lenovo-aio-p-HBC0000FC0LTQ",
    html,
    fetchedAt: "2026-08-13T00:00:00.000Z",
    aiExtractor,
  });

  assert.equal(result.validation.valid, true);
  assert.equal(result.profile.productCategory, "desktopComputer");
  assert.ok(aiText.length <= 12_000);
  assert.match(aiText, /Monitör PC \(All-in-One\)/);
  assert.match(aiText, /SSD Kapasitesi: 512 gb/);
  assert.doesNotMatch(aiText, /Kampanya Sepet Stok Kampanya Sepet Stok/);
});

test("ULTEF: Hepsiburada all-in-one fallback extracts visible product info", async () => {
  const html = `
    <html>
      <head><title>Lenovo Ideacentre Intel Core Ultra 5 226V 16GB 512GB SSD Fiyatı</title></head>
      <body>
        <script type="mime/invalid" id="reduxStore">
          {
            "productState": {
              "product": {
                "brand": "Lenovo",
                "sku": "HBCV0000FC0LUS",
                "name": "Ideacentre Intel Core Ultra 5 226V 16GB 512GB SSD Freedos 27\\" FHD All In One Bilgisayar F0JW000HTR",
                "categories": [
                  { "categoryName": "Bilgisayar Sistemleri ve Ekipmanları" },
                  { "categoryName": "Bilgisayarlar" },
                  { "categoryName": "Monitör PC (All-in-One)" }
                ],
                "variants": []
              }
            }
          }
        </script>
        <h2>Ürün Bilgileri</h2>
        <div><div>Ekran Boyutu</div><div>27 inç</div></div>
        <div><div>SSD Kapasitesi</div><div>512 GB</div></div>
        <div><div>Ram (Sistem Belleği)</div><div>16 GB</div></div>
      </body>
    </html>
  `;

  const result = await extractProductFeatureProfile({
    url: "https://www.hepsiburada.com/lenovo-aio-p-HBC0000FC0LTQ",
    html,
    fetchedAt: "2026-08-13T00:00:00.000Z",
  });

  assert.equal(result.extractionMode, "structuredFallback");
  assert.equal(result.validation.valid, true);
  assert.equal(result.profile.productCategory, "desktopComputer");
  assert.deepEqual(
    result.profile.features.map((feature) => ({
      label: feature.label,
      value: feature.value,
      unit: feature.unit,
    })),
    [
      { label: "Ekran Boyutu", value: 27, unit: "inc" },
      { label: "SSD Kapasitesi", value: 512, unit: "gb" },
      { label: "Ram (Sistem Belleği)", value: 16, unit: "gb" },
    ],
  );
});
