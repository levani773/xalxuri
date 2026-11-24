// ლოკალური (სამუშაო) რეჟიმი: ბაზის მართვის პანელი ჩართულია.
// საიტისთვის build_site.py ქმნის სხვა config.js-ს (publicMode: true),
// მაგრამ imageSearch და imageThreshold მნიშვნელობებს ამ ფაილიდან იღებს.
window.CHATBOT_CONFIG = {
    publicMode: false,
    version: '',

    // სურათით ძებნის ღილაკი (true / false)
    imageSearch: true,

    // მსგავსების ზღვარი 0-დან 1-მდე. რაც მაღალია, მით მკაცრია.
    // სურათით ძებნისას პასუხში ჩანს მსგავსების %, ამით დაარეგულირე.
    imageThreshold: 0.7
};
