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
