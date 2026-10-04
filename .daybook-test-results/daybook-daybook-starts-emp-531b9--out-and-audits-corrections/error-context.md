# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: daybook.spec.ts >> daybook starts empty, persists money in and cash out, and audits corrections
- Location: tests\daybook.spec.ts:99:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:4173/admin?tab=daybook", waiting until "load"

```

# Page snapshot

```yaml
- main [ref=f25e3]:
  - generic [ref=f25e4]:
    - heading "Crunchy Bag ? Fried Chicken & Burgers in Imadol, Lalitpur" [level=1] [ref=f25e5]
    - paragraph [ref=f25e6]: Welcome to Crunchy Bag, Kathmandu Valley's premier destination for artisan crispy fried chicken, gourmet smash burgers, authentic Nepali spiced pakodas, and golden fries. Order online for rapid doorstep food delivery across Kathmandu, Lalitpur, and Bhaktapur with cashless eSewa and FonePay checkout.
  - generic [ref=f25e7]:
    - heading "Signature Recipes & Fast Food Specialties" [level=2] [ref=f25e8]
    - paragraph [ref=f25e9]: Our signature crispy fried chicken is freshly marinated with premium Himalayan spices, hand-breaded in our proprietary crunch coating, and pressure-fried to golden perfection. Savor our handcrafted burgers, including the best-selling Crunchy Fried Chicken Burger, juicy Chicken Burgers, and crispy Aloo Tikki Burgers layered with fresh lettuce, tomatoes, and house-made signature sauces.
  - heading "Authentic Nepalese Pakodas & Crispy Snacks" [level=2] [ref=f25e10]
  - paragraph [ref=f25e11]: Indulge in authentic local favorites and crunchy fritters, including Paneer Pakoda, Gobi Pakoda, Onion Pakoda, Green Chicken Pakoda, and classic mixed vegetable pakodas served with tangy mint and coriander chutneys. Complete your feast with salted golden French fries and herb-seasoned crispy potatoes.
  - heading "Chilled Beverages, Thick Shakes & Cold Coffee" [level=2] [ref=f25e12]
  - paragraph [ref=f25e13]: Quench your thirst with our handcrafted drinks lineup, featuring rich Cold Coffee blended with Oreo cookies, thick chocolate milkshakes, traditional sweet yogurt Lassi, fresh seasonal fruit juices, and chilled Coke.
  - heading "Express Food Delivery Across Kathmandu, Lalitpur & Bhaktapur" [level=2] [ref=f25e14]
  - paragraph [ref=f25e15]: Crunchy Bag provides reliable, rapid food delivery across 35+ neighborhoods throughout Kathmandu Valley. We deliver to Imadol, Balkumari, Bojhpokhari, Tikathali, Koteshwor, Tinkune, Baneshwor, New Baneshwor, Minbhawan, Jadibuti, Thimi, Bhaktapur, Gwarko, Sanepa, Kupandole, Lagankhel, Satdobato, Kumaripati, Jawalakhel, Jhamsikhel, Durbar Marg, and Thamel.
  - heading "Table Reservations & In-Restaurant Dining Hospitality" [level=2] [ref=f25e16]
  - paragraph [ref=f25e17]: Experience welcoming dine-in hospitality at our central restaurant in Imadol, Lalitpur. Reserve your table online in seconds for quick table service, friendly hospitality, and cozy dining with family and friends.
  - heading "100% Cashless Digital Checkout with eSewa & FonePay" [level=2] [ref=f25e18]
  - paragraph [ref=f25e19]: Enjoy effortless and secure digital payments. Crunchy Bag natively supports instant online payment via eSewa digital wallet, FonePay QR code scanning, and cash on delivery or pickup with real-time verification.
  - heading "Clean Internal Navigation & Site Architecture" [level=2] [ref=f25e20]
  - navigation "Core Store Pages" [ref=f25e21]:
    - list [ref=f25e22]:
      - listitem [ref=f25e23]:
        - link "Crunchy Bag Home" [ref=f25e24] [cursor=pointer]:
          - /url: /
      - listitem [ref=f25e25]:
        - link "Full Online Food Menu" [ref=f25e26] [cursor=pointer]:
          - /url: /menu
      - listitem [ref=f25e27]:
        - link "Family Deals & Value Combos" [ref=f25e28] [cursor=pointer]:
          - /url: /combos
      - listitem [ref=f25e29]:
        - link "Kathmandu Valley Delivery Coverage" [ref=f25e30] [cursor=pointer]:
          - /url: /delivery
      - listitem [ref=f25e31]:
        - link "Book Table Near Me Online" [ref=f25e32] [cursor=pointer]:
          - /url: /reserve
      - listitem [ref=f25e33]:
        - link "Live Order Tracking" [ref=f25e34] [cursor=pointer]:
          - /url: /orders
      - listitem [ref=f25e35]:
        - link "Customer Account Profile" [ref=f25e36] [cursor=pointer]:
          - /url: /profile
      - listitem [ref=f25e37]:
        - link "Culinary Journal & Food Stories" [ref=f25e38] [cursor=pointer]:
          - /url: /blogs
      - listitem [ref=f25e39]:
        - link "Store Locations & Contact" [ref=f25e40] [cursor=pointer]:
          - /url: /contact
  - heading "Browse Menu by Food Category" [level=3] [ref=f25e41]
  - navigation "Menu Category Navigation" [ref=f25e42]:
    - list [ref=f25e43]:
      - listitem [ref=f25e44]:
        - link "Crispy Chicken & Veg Burgers" [ref=f25e45] [cursor=pointer]:
          - /url: /menu/burgers
      - listitem [ref=f25e46]:
        - link "Artisanal Crispy Fried Chicken" [ref=f25e47] [cursor=pointer]:
          - /url: /menu/fried-chicken
      - listitem [ref=f25e48]:
        - link "Special Combos & Family Bags" [ref=f25e49] [cursor=pointer]:
          - /url: /menu/special-combos
      - listitem [ref=f25e50]:
        - link "Traditional Nepalese Pakodas & Snacks" [ref=f25e51] [cursor=pointer]:
          - /url: /menu/pakoda-snacks
      - listitem [ref=f25e52]:
        - link "French Fries & Crispy Potatoes" [ref=f25e53] [cursor=pointer]:
          - /url: /menu/fries-crispy
      - listitem [ref=f25e54]:
        - link "Fresh Grilled Sandwiches" [ref=f25e55] [cursor=pointer]:
          - /url: /menu/sandwiches
      - listitem [ref=f25e56]:
        - link "Chilled Beverages, Shakes & Cold Coffee" [ref=f25e57] [cursor=pointer]:
          - /url: /menu/drinks-shakes
      - listitem [ref=f25e58]:
        - link "Fresh Healthy Fruit Salads" [ref=f25e59] [cursor=pointer]:
          - /url: /menu/salads
  - heading "Fast Food Delivery Neighborhoods in Kathmandu Valley" [level=3] [ref=f25e60]
  - navigation "Delivery Locations Navigation" [ref=f25e61]:
    - list [ref=f25e62]:
      - listitem [ref=f25e63]:
        - link "Fast Food Delivery Kathmandu" [ref=f25e64] [cursor=pointer]:
          - /url: /delivery/kathmandu
      - listitem [ref=f25e65]:
        - link "Fast Food Delivery Lalitpur" [ref=f25e66] [cursor=pointer]:
          - /url: /delivery/lalitpur
      - listitem [ref=f25e67]:
        - link "Fast Food Delivery Bhaktapur" [ref=f25e68] [cursor=pointer]:
          - /url: /delivery/bhaktapur
      - listitem [ref=f25e69]:
        - link "Online Food Delivery in Imadol" [ref=f25e70] [cursor=pointer]:
          - /url: /delivery/imadol
      - listitem [ref=f25e71]:
        - link "Online Food Delivery in Balkumari" [ref=f25e72] [cursor=pointer]:
          - /url: /delivery/balkumari
      - listitem [ref=f25e73]:
        - link "Online Food Delivery in Koteshwor" [ref=f25e74] [cursor=pointer]:
          - /url: /delivery/koteshwor
      - listitem [ref=f25e75]:
        - link "Online Food Delivery in Tinkune" [ref=f25e76] [cursor=pointer]:
          - /url: /delivery/tinkune
      - listitem [ref=f25e77]:
        - link "Online Food Delivery in Baneshwor" [ref=f25e78] [cursor=pointer]:
          - /url: /delivery/baneshwor
      - listitem [ref=f25e79]:
        - link "Online Food Delivery in New Baneshwor" [ref=f25e80] [cursor=pointer]:
          - /url: /delivery/new-baneshwor
      - listitem [ref=f25e81]:
        - link "Online Food Delivery in Thimi" [ref=f25e82] [cursor=pointer]:
          - /url: /delivery/thimi
      - listitem [ref=f25e83]:
        - link "Online Food Delivery in Gwarko" [ref=f25e84] [cursor=pointer]:
          - /url: /delivery/gwarko
      - listitem [ref=f25e85]:
        - link "Online Food Delivery in Jhamsikhel" [ref=f25e86] [cursor=pointer]:
          - /url: /delivery/jhamsikhel
      - listitem [ref=f25e87]:
        - link "Online Food Delivery in Durbar Marg" [ref=f25e88] [cursor=pointer]:
          - /url: /delivery/durbar-marg
      - listitem [ref=f25e89]:
        - link "Online Food Delivery in Thamel" [ref=f25e90] [cursor=pointer]:
          - /url: /delivery/thamel
      - listitem [ref=f25e91]:
        - link "Online Food Delivery in Chabahil" [ref=f25e92] [cursor=pointer]:
          - /url: /delivery/chabahil
      - listitem [ref=f25e93]:
        - link "Online Food Delivery in Bouddha" [ref=f25e94] [cursor=pointer]:
          - /url: /delivery/bouddha
  - heading "Customer Information & Policies" [level=3] [ref=f25e95]
  - navigation "Legal and Information Links" [ref=f25e96]:
    - list [ref=f25e97]:
      - listitem [ref=f25e98]:
        - link "About Crunchy Bag Restaurant" [ref=f25e99] [cursor=pointer]:
          - /url: /about
      - listitem [ref=f25e100]:
        - link "Customer Privacy Policy" [ref=f25e101] [cursor=pointer]:
          - /url: /privacy
      - listitem [ref=f25e102]:
        - link "Ordering FAQ & Help Center" [ref=f25e103] [cursor=pointer]:
          - /url: /faq
      - listitem [ref=f25e104]:
        - link "Terms & Conditions of Service" [ref=f25e105] [cursor=pointer]:
          - /url: /terms
      - listitem [ref=f25e106]:
        - link "Contact & Store Locations" [ref=f25e107] [cursor=pointer]:
          - /url: /contact
  - heading "Verified External Partners & Entity Profiles" [level=2] [ref=f25e108]
  - navigation "Authoritative Entity Links" [ref=f25e109]:
    - list [ref=f25e110]:
      - listitem [ref=f25e111]:
        - link "Crunchy Bag Central Kitchen on Google Maps" [ref=f25e112] [cursor=pointer]:
          - /url: https://share.google/wJPKlrcMJueR0EmvX
      - listitem [ref=f25e113]:
        - link "eSewa Official Digital Payment Gateway" [ref=f25e114] [cursor=pointer]:
          - /url: https://esewa.com.np
      - listitem [ref=f25e115]:
        - link "FonePay QR Payment Network Nepal" [ref=f25e116] [cursor=pointer]:
          - /url: https://fonepay.com
      - listitem [ref=f25e117]:
        - link "Crunchy Bag on Facebook" [ref=f25e118] [cursor=pointer]:
          - /url: https://www.facebook.com/crunchybag
      - listitem [ref=f25e119]:
        - link "Crunchy Bag on Instagram" [ref=f25e120] [cursor=pointer]:
          - /url: https://www.instagram.com/crunchybag
      - listitem [ref=f25e121]:
        - link "Crunchy Bag on TikTok" [ref=f25e122] [cursor=pointer]:
          - /url: https://www.tiktok.com/@crunchybag
  - heading "Our Full Online Food Menu & Dishes" [level=2] [ref=f25e123]
  - navigation "Products and Combos Directory" [ref=f25e124]:
    - list [ref=f25e125]:
      - listitem [ref=f25e126]:
        - link "Aloo Tikki Burger" [ref=f25e127] [cursor=pointer]:
          - /url: /product/prod-aloo-tikki-burger-f1168a550eab
        - text: "- Rs. 99.00 (Crispy golden aloo tikki with fresh veggies and sauces)"
      - listitem [ref=f25e128]:
        - link "Chicken Burger" [ref=f25e129] [cursor=pointer]:
          - /url: /product/prod-new-item-e3e0dadb97b5
        - text: "- Rs. 159.00 (Juicy chicken patty, fresh lettuce, tomato, signature sauces)"
      - listitem [ref=f25e130]:
        - link "Crunchy Fried chicken Burger" [ref=f25e131] [cursor=pointer]:
          - /url: /product/prod-pizza-veg-27c34985033e
        - text: "- Rs. 259.00 (Crispy golden fried chicken in toasted bun)"
      - listitem [ref=f25e132]:
        - link "Crunchy fried chicken" [ref=f25e133] [cursor=pointer]:
          - /url: /product/prod-crunchy-fried-chicken-0a5da9922717
        - text: "- Rs. 349.00 (Crispy, juicy golden fried chicken)"
      - listitem [ref=f25e134]:
        - link "Crispy Potatoes" [ref=f25e135] [cursor=pointer]:
          - /url: /product/prod-crispy-potatoes-6e8f133152fa
        - text: "- Rs. 99.00 (Golden crispy potato bites)"
      - listitem [ref=f25e136]:
        - link "French Friess" [ref=f25e137] [cursor=pointer]:
          - /url: /product/prod-french-friess-5f06b09954d9
        - text: "- Rs. 159.00 (Hot golden crispy salted or cheese masala fries)"
      - listitem [ref=f25e138]:
        - link "Burger Fired Best Combo Package" [ref=f25e139] [cursor=pointer]:
          - /url: /product/prod-buger-fired-best-combo-packages-22d9b39730ad
        - text: "- Rs. 152.15 (Value combo deal)"
      - listitem [ref=f25e140]:
        - link "Chicken 65 Pakoda" [ref=f25e141] [cursor=pointer]:
          - /url: /product/prod-chicken-65-pakoda-520d8e87ad56
        - text: "- Rs. 289.00 (Crispy spicy chicken bites with green chutney)"
      - listitem [ref=f25e142]:
        - link "Classic chicken Pakoda" [ref=f25e143] [cursor=pointer]:
          - /url: /product/prod-classic-chicken-pakoda-ec85493d7b6a
        - text: "- Rs. 259.00 (Juicy spiced chicken fritters)"
      - listitem [ref=f25e144]:
        - link "Green Chicken Pakoda" [ref=f25e145] [cursor=pointer]:
          - /url: /product/prod-green-chicken-pakoda-2419478e9e10
        - text: "- Rs. 319.00 (Cilantro-mint spiced chicken pakoda)"
      - listitem [ref=f25e146]:
        - link "Seasme Chicken Pakoda" [ref=f25e147] [cursor=pointer]:
          - /url: /product/prod-seasme-chicken-pakoda-ee78c1b63402
        - text: "- Rs. 289.00 (Sesame coated crunchy chicken)"
      - listitem [ref=f25e148]:
        - link "Paneer Pakoda" [ref=f25e149] [cursor=pointer]:
          - /url: /product/prod-paneer-pakoda-2e4d08e69b67
        - text: "- Rs. 279.00 (Fresh spiced cottage cheese fritters)"
      - listitem [ref=f25e150]:
        - link "Gobi Pakoda" [ref=f25e151] [cursor=pointer]:
          - /url: /product/prod-gobi-pakoda-d6d34fca0bbb
        - text: "- Rs. 149.00 (Crispy spiced cauliflower fritters)"
      - listitem [ref=f25e152]:
        - link "Onion Pakoda" [ref=f25e153] [cursor=pointer]:
          - /url: /product/prod-onion-pakoda-cca533c5d602
        - text: "- Rs. 119.00 (Golden crunchy onion fritters)"
      - listitem [ref=f25e154]:
        - link "Veg Pakoda" [ref=f25e155] [cursor=pointer]:
          - /url: /product/prod-veg-pakoda-cbe7c1b902cc
        - text: "- Rs. 119.00 (Fresh mixed vegetable pakoda)"
      - listitem [ref=f25e156]:
        - link "Classic Pakoda" [ref=f25e157] [cursor=pointer]:
          - /url: /product/prod-classic-pakoda-087973d01a13
        - text: "- Rs. 99.00 (Traditional crispy spiced pakoda)"
      - listitem [ref=f25e158]:
        - link "Fresh Fruits Salad" [ref=f25e159] [cursor=pointer]:
          - /url: /product/prod-fresh-fruits-salad-4824f7a0e061
        - text: "- Rs. 119.00 (Seasonal fruits with nuts & cream)"
      - listitem [ref=f25e160]:
        - link "Chicken Grilled Sandwich" [ref=f25e161] [cursor=pointer]:
          - /url: /product/prod-chicken-grilled-sandwich-1adee98feada
        - text: "- Rs. 149.00 (Grilled chicken & signature sauce)"
      - listitem [ref=f25e162]:
        - link "Veg Grilled Sandwich" [ref=f25e163] [cursor=pointer]:
          - /url: /product/prod-veg-grilled-sandwich-619d917e99a0
        - text: "- Rs. 99.00 (Fresh vegetables & seasonings)"
      - listitem [ref=f25e164]:
        - link "Plain Sandwich" [ref=f25e165] [cursor=pointer]:
          - /url: /product/prod-plain-sandwich-6d0889e4b609
        - text: "- Rs. 37.05 (Soft bread with mayo & fresh veggies)"
      - listitem [ref=f25e166]:
        - link "Cold Coffee" [ref=f25e167] [cursor=pointer]:
          - /url: /product/prod-cold-coffee-469955c644d4
        - text: "- Rs. 159.00 (Iced coffee blended with Oreo & chocolate)"
      - listitem [ref=f25e168]:
        - link "Fresh Fruit Juice" [ref=f25e169] [cursor=pointer]:
          - /url: /product/prod-fresh-fruit-juice-b9c810c592c2
        - text: "- Rs. 139.00 (Fresh blended fruits)"
      - listitem [ref=f25e170]:
        - link "Milk Shake" [ref=f25e171] [cursor=pointer]:
          - /url: /product/prod-milk-shake-63d7db029b2a
        - text: "- Rs. 129.00 (Thick shake with Oreo & whipped cream)"
      - listitem [ref=f25e172]:
        - link "Lassi" [ref=f25e173] [cursor=pointer]:
          - /url: /product/prod-lassi-1eaa30d4ec44
        - text: "- Rs. 129.00 (Sweet yogurt lassi with dry fruits)"
      - listitem [ref=f25e174]:
        - link "Coke" [ref=f25e175] [cursor=pointer]:
          - /url: /product/prod-coke-ca7879363c6b
        - text: "- Rs. 80.00 (Chilled cold drink)"
      - listitem [ref=f25e176]:
        - link "Cheese Sauce" [ref=f25e177] [cursor=pointer]:
          - /url: /product/prod-cheese-sauce-787f318cff69
        - text: "- Rs. 61.00"
      - listitem [ref=f25e178]:
        - link "Cocktail Sauce" [ref=f25e179] [cursor=pointer]:
          - /url: /product/prod-cocktail-sauce-831c6b40e4fe
        - text: "- Rs. 21.00"
      - listitem [ref=f25e180]:
        - link "Green Mayonnaise" [ref=f25e181] [cursor=pointer]:
          - /url: /product/prod-green-mayonnaise-24f815d2f7db
        - text: "- Rs. 41.00"
      - listitem [ref=f25e182]:
        - link "Green Sauce" [ref=f25e183] [cursor=pointer]:
          - /url: /product/prod-green-sauce-a1543aa62586
        - text: "- Rs. 31.00"
      - listitem [ref=f25e184]:
        - link "Ketch Up" [ref=f25e185] [cursor=pointer]:
          - /url: /product/prod-ketch-up-a32cb24ba8e6
        - text: "- Rs. 11.00"
      - listitem [ref=f25e186]:
        - link "Mayonnaise" [ref=f25e187] [cursor=pointer]:
          - /url: /product/prod-mayonnaise-4c73818c1f15
        - text: "- Rs. 31.00"
      - listitem [ref=f25e188]:
        - link "Tandoori Mayonnaise" [ref=f25e189] [cursor=pointer]:
          - /url: /product/prod-tandoori-mayonnaise-3e1b018ef79e
        - text: "- Rs. 51.00"
      - listitem [ref=f25e190]:
        - link "Crunchy Family Bag" [ref=f25e191] [cursor=pointer]:
          - /url: /product/prod-crunchy-family-bag-f182f11d777e
        - text: "- Rs. 1292.25 (4 Burgers, Fried Chicken, Pakoda, Fries & 4 Cokes)"
      - listitem [ref=f25e192]:
        - link "Crunchy Beast Combo" [ref=f25e193] [cursor=pointer]:
          - /url: /product/prod-crunchy-beast-combo-8996a2c37936
        - text: "- Rs. 677.60 (Crispy chicken, chicken pakoda, fries & Coke)"
      - listitem [ref=f25e194]:
        - link "Crunchy Duo Combo" [ref=f25e195] [cursor=pointer]:
          - /url: /product/prod-crunchy-duo-combo-49a6969348ad
        - text: "- Rs. 541.45 (2 chicken burgers, fries & 2 Cokes)"
      - listitem [ref=f25e196]:
        - link "Crunchy Loaded Combo" [ref=f25e197] [cursor=pointer]:
          - /url: /product/prod-crunchy-loaded-combo-228c7d8f1f37
        - text: "- Rs. 339.30 (Aloo tikki burger, veg pakoda, crispy potatoes & Coke)"
      - listitem [ref=f25e198]:
        - link "Crunchy Chicken Combo" [ref=f25e199] [cursor=pointer]:
          - /url: /product/prod-crunchy-chicken-combo-bdb9434dbe9c
        - text: "- Rs. 338.30 (Chicken burger, fries, dip & Coke)"
      - listitem [ref=f25e200]:
        - link "Crunchy Starter Combo" [ref=f25e201] [cursor=pointer]:
          - /url: /product/prod-crunchy-starter-combo-b641d8d27fe4
        - text: "- Rs. 304.20 (Veg burger, crispy fries, dip & drink)"
  - heading "Delivery Areas & Neighborhoods in Kathmandu Valley" [level=2] [ref=f25e202]
  - navigation "Delivery Locations Directory" [ref=f25e203]:
    - list [ref=f25e204]:
      - listitem [ref=f25e205]:
        - link "Food Delivery in Imadol" [ref=f25e206] [cursor=pointer]:
          - /url: /delivery/imadol
      - listitem [ref=f25e207]:
        - link "Food Delivery in Balkumari" [ref=f25e208] [cursor=pointer]:
          - /url: /delivery/balkumari
      - listitem [ref=f25e209]:
        - link "Food Delivery in Bojhpokhari" [ref=f25e210] [cursor=pointer]:
          - /url: /delivery/bojhpokhari
      - listitem [ref=f25e211]:
        - link "Food Delivery in Tikathali" [ref=f25e212] [cursor=pointer]:
          - /url: /delivery/tikathali
      - listitem [ref=f25e213]:
        - link "Food Delivery in Koteshwor" [ref=f25e214] [cursor=pointer]:
          - /url: /delivery/koteshwor
      - listitem [ref=f25e215]:
        - link "Food Delivery in Tinkune" [ref=f25e216] [cursor=pointer]:
          - /url: /delivery/tinkune
      - listitem [ref=f25e217]:
        - link "Food Delivery in Baneshwor" [ref=f25e218] [cursor=pointer]:
          - /url: /delivery/baneshwor
      - listitem [ref=f25e219]:
        - link "Food Delivery in New Baneshwor" [ref=f25e220] [cursor=pointer]:
          - /url: /delivery/new-baneshwor
      - listitem [ref=f25e221]:
        - link "Food Delivery in Minbhawan" [ref=f25e222] [cursor=pointer]:
          - /url: /delivery/minbhawan
      - listitem [ref=f25e223]:
        - link "Food Delivery in Jadibuti" [ref=f25e224] [cursor=pointer]:
          - /url: /delivery/jadibuti
      - listitem [ref=f25e225]:
        - link "Food Delivery in Thimi" [ref=f25e226] [cursor=pointer]:
          - /url: /delivery/thimi
      - listitem [ref=f25e227]:
        - link "Food Delivery in Bhaktapur" [ref=f25e228] [cursor=pointer]:
          - /url: /delivery/bhaktapur
      - listitem [ref=f25e229]:
        - link "Food Delivery in Gwarko" [ref=f25e230] [cursor=pointer]:
          - /url: /delivery/gwarko
      - listitem [ref=f25e231]:
        - link "Food Delivery in Sanepa" [ref=f25e232] [cursor=pointer]:
          - /url: /delivery/sanepa
      - listitem [ref=f25e233]:
        - link "Food Delivery in Kupandole" [ref=f25e234] [cursor=pointer]:
          - /url: /delivery/kupandole
      - listitem [ref=f25e235]:
        - link "Food Delivery in Lagankhel" [ref=f25e236] [cursor=pointer]:
          - /url: /delivery/lagankhel
      - listitem [ref=f25e237]:
        - link "Food Delivery in Satdobato" [ref=f25e238] [cursor=pointer]:
          - /url: /delivery/satdobato
      - listitem [ref=f25e239]:
        - link "Food Delivery in Kumaripati" [ref=f25e240] [cursor=pointer]:
          - /url: /delivery/kumaripati
      - listitem [ref=f25e241]:
        - link "Food Delivery in Jawalakhel" [ref=f25e242] [cursor=pointer]:
          - /url: /delivery/jawalakhel
      - listitem [ref=f25e243]:
        - link "Food Delivery in Jhamsikhel" [ref=f25e244] [cursor=pointer]:
          - /url: /delivery/jhamsikhel
      - listitem [ref=f25e245]:
        - link "Food Delivery in Durbar Marg" [ref=f25e246] [cursor=pointer]:
          - /url: /delivery/durbar-marg
      - listitem [ref=f25e247]:
        - link "Food Delivery in Thamel" [ref=f25e248] [cursor=pointer]:
          - /url: /delivery/thamel
      - listitem [ref=f25e249]:
        - link "Food Delivery in Chabahil" [ref=f25e250] [cursor=pointer]:
          - /url: /delivery/chabahil
      - listitem [ref=f25e251]:
        - link "Food Delivery in Bouddha" [ref=f25e252] [cursor=pointer]:
          - /url: /delivery/bouddha
      - listitem [ref=f25e253]:
        - link "Food Delivery in Maharajgunj" [ref=f25e254] [cursor=pointer]:
          - /url: /delivery/maharajgunj
      - listitem [ref=f25e255]:
        - link "Food Delivery in Baluwatar" [ref=f25e256] [cursor=pointer]:
          - /url: /delivery/baluwatar
      - listitem [ref=f25e257]:
        - link "Food Delivery in Lazimpat" [ref=f25e258] [cursor=pointer]:
          - /url: /delivery/lazimpat
      - listitem [ref=f25e259]:
        - link "Food Delivery in Kalanki" [ref=f25e260] [cursor=pointer]:
          - /url: /delivery/kalanki
      - listitem [ref=f25e261]:
        - link "Food Delivery in Kirtipur" [ref=f25e262] [cursor=pointer]:
          - /url: /delivery/kirtipur
      - listitem [ref=f25e263]:
        - link "Food Delivery in Sinamangal" [ref=f25e264] [cursor=pointer]:
          - /url: /delivery/sinamangal
      - listitem [ref=f25e265]:
        - link "Food Delivery in Gaushala" [ref=f25e266] [cursor=pointer]:
          - /url: /delivery/gaushala
      - listitem [ref=f25e267]:
        - link "Food Delivery in Old Baneshwor" [ref=f25e268] [cursor=pointer]:
          - /url: /delivery/old-baneshwor
      - listitem [ref=f25e269]:
        - link "Food Delivery in Maitighar" [ref=f25e270] [cursor=pointer]:
          - /url: /delivery/maitighar
      - listitem [ref=f25e271]:
        - link "Food Delivery in Tripureshwor" [ref=f25e272] [cursor=pointer]:
          - /url: /delivery/tripureshwor
      - listitem [ref=f25e273]:
        - link "Food Delivery in Putalisadak" [ref=f25e274] [cursor=pointer]:
          - /url: /delivery/putalisadak
  - generic [ref=f25e275]:
    - paragraph [ref=f25e276]:
      - strong [ref=f25e277]: "Location:"
      - text: Imadol, Lalitpur, Nepal (
      - link "Google Maps Directions" [ref=f25e278] [cursor=pointer]:
        - /url: https://share.google/wJPKlrcMJueR0EmvX
      - text: )
    - paragraph [ref=f25e279]:
      - strong [ref=f25e280]: "Call / Order Hotline:"
      - link "9761503339" [ref=f25e281] [cursor=pointer]:
        - /url: tel:9761503339
      - text: "|"
      - strong [ref=f25e282]: "Hours:"
      - text: 10:00 AM – 11:30 PM Daily (Mon–Sun)
    - paragraph [ref=f25e283]: © 2026 Crunchy Bag Restaurant. All rights reserved.
```

# Test source

```ts
  1   | import {test, expect, Page} from '@playwright/test';
  2   | 
  3   | const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kathmandu',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  4   | 
  5   | async function setup(page:Page) {
  6   |   const user={id:1,username:'Daybook owner',role:'RESTAURANT_OWNER',outlet_id:1,is_active:true};
  7   |   const outlet={id:1,name:'Real outlet',branch_code:'REAL'};
  8   |   const state:any={entries:[],writes:[],responses:{},nextId:1,sockets:[],loseResponse:false,payments:[
  9   |     {id:1,order_number:'POS-01',customer:'Customer one',source:'POS',amount:'150.00',payment_method:'CASH',transaction_id:'PAY-CASH',created_at:new Date().toISOString(),kind:'SALE'},
  10  |     {id:2,order_number:'POS-01',customer:'Customer one',source:'POS',amount:'50.00',payment_method:'FONEPAY',transaction_id:'PAY-QR',created_at:new Date().toISOString(),kind:'SALE'},
  11  |     {id:3,order_number:'W-02',customer:'Customer two',source:'WEBSITE',amount:'80.00',payment_method:'FONEPAY',transaction_id:'PAY-WEB',created_at:new Date().toISOString(),kind:'SALE'},
  12  |     {id:4,order_number:'POS-01',customer:'Customer one',source:'POS',amount:'20.00',payment_method:'CASH',transaction_id:'REF-CASH',created_at:new Date().toISOString(),kind:'REFUND'},
  13  |   ]};
  14  |   await page.addInitScript(({user,outlet})=>{
  15  |     localStorage.setItem('crunchy_access_token','test-token');
  16  |     localStorage.setItem('crunchy_auth_user',JSON.stringify(user));
  17  |     localStorage.setItem('crunchy_auth_outlet',JSON.stringify(outlet));
  18  |     document.cookie='csrftoken=abcdefghijklmnopqrstuvwx12345678; path=/';
  19  |   },{user,outlet});
  20  |   await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  21  |   await page.routeWebSocket('**/ws/**',socket=>{
  22  |     if(socket.url().includes('/daybook/')){
  23  |       state.sockets.push(socket);
  24  |       socket.onMessage(()=>socket.send(JSON.stringify({event_type:'HEARTBEAT',revision:String(state.entries.length)})));
  25  |     }
  26  |   });
  27  |   const entry=(body:any)=>({id:state.nextId++,date:today(),party:'',reference:'',source:'MANUAL',recorded_by:user.username,
  28  |     created_at:new Date().toISOString(),voided_at:null,voided_by:null,void_reason:'',...body});
  29  |   await page.route('**/api/v1/**',async route=>{
  30  |     const req=route.request(),url=new URL(req.url()),path=url.pathname;
  31  |     let data:any={};
  32  |     if(path.endsWith('/auth/me/'))data=user;
  33  |     else if(path.includes('/branches'))data=[outlet];
  34  |     else if(path.includes('/organization'))data={name:'Real restaurant'};
  35  |     else if(path.endsWith('/customer/profile/'))data={favorites:[],member_since:'2026-01-01'};
  36  |     else if(path.endsWith('/customer/orders/'))data={results:[]};
  37  |     else if(path.endsWith('/catalog/menu/'))data={categories:[]};
  38  |     else if(path==='/api/v1/daybook/socket-ticket/')data={ticket:'signed',path:'/ws/daybook/1/'};
  39  |     else if(path.startsWith('/api/v1/daybook/')){
  40  |       if(req.method()==='POST'){
  41  |         const body=req.postDataJSON(),key=req.headers()['idempotency-key'];
  42  |         state.writes.push({path,body,key});
  43  |         if(state.responses[key])data=state.responses[key];
  44  |         else {
  45  |           if(path.endsWith('/import/')){
  46  |             let created=0,skipped=0;
  47  |             for(const id of body.payment_ids){
  48  |               if(state.entries.some((e:any)=>e.payment_id===id)){skipped++;continue;}
  49  |               const payment=state.payments.find((p:any)=>p.id===id);
  50  |               state.entries.push(entry({date:body.date,direction:body.kind==='SALE'?'IN':'OUT',amount:payment.amount,
  51  |                 payment_method:payment.payment_method,category:body.kind==='SALE'?'Sales received':'Sales refund',
  52  |                 description:`Payment for order ${payment.order_number}`,reference:payment.transaction_id,source:body.kind,payment_id:id}));created++;
  53  |             }
  54  |             data={created,skipped,date:body.date};
  55  |           }else if(path.endsWith('/void/')){
  56  |             const id=Number(path.split('/').at(-3));
  57  |             data=state.entries.find((e:any)=>e.id===id);
  58  |             Object.assign(data,{voided_at:new Date().toISOString(),voided_by:user.username,void_reason:body.reason});
  59  |           }else{data=entry(body);state.entries.push(data);}
  60  |           state.responses[key]=data;
  61  |         }
  62  |         if(state.loseResponse){state.loseResponse=false;await route.abort('failed');return;}
  63  |       }else if(path.endsWith('/import/')){
  64  |         const kind=url.searchParams.get('kind')||'SALE';
  65  |         const results=state.payments.filter((p:any)=>p.kind===kind).map((p:any)=>({...p,
  66  |           imported:state.entries.some((e:any)=>e.payment_id===p.id),voided:state.entries.some((e:any)=>e.payment_id===p.id&&e.voided_at)}));
  67  |         data={date:url.searchParams.get('date'),kind,results,count:results.length,truncated:false};
  68  |       }else{
  69  |         const date=url.searchParams.get('date')||today();
  70  |         const active=state.entries.filter((e:any)=>!e.voided_at);
  71  |         const sum=(rows:any[],direction:string)=>rows.filter(e=>e.direction===direction).reduce((n,e)=>n+Number(e.amount),0);
  72  |         const before=active.filter((e:any)=>e.date<date),day=active.filter((e:any)=>e.date===date);
  73  |         const opening=sum(before,'IN')-sum(before,'OUT'),income=sum(day,'IN'),expense=sum(day,'OUT');
  74  |         const cashBefore=before.filter((e:any)=>e.payment_method==='CASH'),cashDay=day.filter((e:any)=>e.payment_method==='CASH');
  75  |         const cashOpening=sum(cashBefore,'IN')-sum(cashBefore,'OUT'),cashIn=sum(cashDay,'IN'),cashOut=sum(cashDay,'OUT');
  76  |         let rows=state.entries.filter((e:any)=>e.date===date&&(url.searchParams.get('include_voided')==='true'||!e.voided_at));
  77  |         if(url.searchParams.get('direction')!=='ALL')rows=rows.filter((e:any)=>e.direction===url.searchParams.get('direction'));
  78  |         if(url.searchParams.get('payment_method')!=='ALL')rows=rows.filter((e:any)=>e.payment_method===url.searchParams.get('payment_method'));
  79  |         if(url.searchParams.get('search'))rows=rows.filter((e:any)=>JSON.stringify(e).toLowerCase().includes(url.searchParams.get('search')!.toLowerCase()));
  80  |         data={date,results:[...rows].reverse(),count:rows.length,page:1,page_size:25,can_void:true,
  81  |           summary:Object.fromEntries(Object.entries({opening,income,expense,net:income-expense,closing:opening+income-expense,
  82  |             cash_opening:cashOpening,cash_in:cashIn,cash_out:cashOut,cash_closing:cashOpening+cashIn-cashOut}).map(([k,v])=>[k,Number(v).toFixed(2)]))};
  83  |       }
  84  |     }
  85  |     await route.fulfill({json:data});
  86  |   });
> 87  |   await page.goto('/admin?tab=daybook');
      |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  88  |   await expect(page.getByTestId('daybook-page').getByRole('heading',{name:'Daybook',exact:true})).toBeVisible();
  89  |   return state;
  90  | }
  91  | 
  92  | async function manual(page:Page,direction:'in'|'out',amount:string,note:string) {
  93  |   await page.getByRole('button',{name:`Money ${direction}`,exact:true}).click();
  94  |   await page.getByLabel('Entry amount',{exact:true}).fill(amount);
  95  |   await page.getByLabel('Entry description',{exact:true}).fill(note);
  96  |   await page.getByRole('button',{name:'Save entry',exact:true}).click();
  97  | }
  98  | 
  99  | test('daybook starts empty, persists money in and cash out, and audits corrections',async({page})=>{
  100 |   const state=await setup(page);
  101 |   await expect(page.getByText('No entries for these filters',{exact:true})).toBeVisible();
  102 |   await expect(page.getByLabel('Daybook date',{exact:true})).toHaveValue(today());
  103 |   await manual(page,'in','1000','Starting cash');
  104 |   await expect(page.getByTestId('daybook-income')).toContainText('1,000');
  105 |   await manual(page,'out','250','Cash taken by manager');
  106 |   await expect(page.getByTestId('daybook-cash_closing')).toContainText('750');
  107 |   expect(state.entries.map((e:any)=>e.direction)).toEqual(['IN','OUT']);
  108 |   await page.reload();
  109 |   await expect(page.getByText('Cash taken by manager',{exact:true})).toBeVisible();
  110 |   await page.getByRole('button',{name:'Void entry DB-2',exact:true}).click();
  111 |   await page.getByLabel('Void reason',{exact:true}).fill('Incorrect amount; replacing entry');
  112 |   await page.getByRole('button',{name:'Void entry',exact:true}).click();
  113 |   await expect(page.getByTestId('daybook-cash_closing')).toContainText('1,000');
  114 |   await page.getByRole('checkbox',{name:'Show voided entries',exact:true}).check();
  115 |   await expect(page.getByText('Voided',{exact:true})).toBeVisible();
  116 |   await expect(page.getByText(/Incorrect amount; replacing entry/)).toBeVisible();
  117 | });
  118 | 
  119 | test('sales import selects all by default, honors unticked sales, and prevents repeated imports',async({page})=>{
  120 |   const state=await setup(page);
  121 |   await page.getByRole('button',{name:"Import today's sales",exact:true}).click();
  122 |   for(const id of ['PAY-CASH','PAY-QR','PAY-WEB'])await expect(page.getByRole('checkbox',{name:`Select payment ${id}`,exact:true})).toBeChecked();
  123 |   await page.getByRole('checkbox',{name:'Select payment PAY-WEB',exact:true}).uncheck();
  124 |   await page.getByRole('button',{name:'Import 2 selected',exact:true}).click();
  125 |   await expect(page.getByTestId('daybook-income')).toContainText('200');
  126 |   expect(state.writes.find((w:any)=>w.path.endsWith('/import/')).body.payment_ids).toEqual([1,2]);
  127 |   await page.getByRole('button',{name:"Import today's sales",exact:true}).click();
  128 |   await expect(page.getByRole('checkbox',{name:'Select payment PAY-CASH',exact:true})).toBeDisabled();
  129 |   await expect(page.getByRole('checkbox',{name:'Select payment PAY-QR',exact:true})).toBeDisabled();
  130 |   await expect(page.getByRole('checkbox',{name:'Select payment PAY-WEB',exact:true})).toBeChecked();
  131 |   await page.getByRole('button',{name:'Import 1 selected',exact:true}).click();
  132 |   await expect(page.getByTestId('daybook-income')).toContainText('280');
  133 |   await page.getByRole('button',{name:'Import refunds',exact:true}).click();
  134 |   await expect(page.getByRole('checkbox',{name:'Select payment REF-CASH',exact:true})).toBeChecked();
  135 |   await page.getByRole('button',{name:'Import 1 selected',exact:true}).click();
  136 |   await expect(page.getByTestId('daybook-expense')).toContainText('20');
  137 |   await expect(page.getByTestId('daybook-closing')).toContainText('260');
  138 |   await page.screenshot({path:test.info().outputPath('daybook.png'),fullPage:true});
  139 | });
  140 | 
  141 | test('lost save response retries the same entry without duplicate cash movement',async({page})=>{
  142 |   const state=await setup(page);
  143 |   state.loseResponse=true;
  144 |   await manual(page,'out','75','Cash withdrawal with retry');
  145 |   await page.getByRole('button',{name:'Retry pending entry',exact:true}).last().click();
  146 |   await expect(page.getByTestId('daybook-expense')).toContainText('75');
  147 |   expect(state.entries).toHaveLength(1);
  148 |   expect(state.writes).toHaveLength(2);
  149 |   expect(state.writes[0].key).toBe(state.writes[1].key);
  150 | });
  151 | 
  152 | test('live daybook updates preserve import selections without navigating',async({page})=>{
  153 |   const state=await setup(page);
  154 |   await page.getByRole('button',{name:"Import today's sales",exact:true}).click();
  155 |   await page.getByRole('checkbox',{name:'Select payment PAY-WEB',exact:true}).uncheck();
  156 |   let navigations=0;page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
  157 |   await expect.poll(()=>state.sockets.length).toBeGreaterThan(0);
  158 |   state.sockets.at(-1).send(JSON.stringify({event_type:'DAYBOOK_CREATE',event_id:'external-entry'}));
  159 |   await expect(page.getByRole('checkbox',{name:'Select payment PAY-WEB',exact:true})).not.toBeChecked();
  160 |   await expect(page.getByRole('checkbox',{name:'Select payment PAY-CASH',exact:true})).toBeChecked();
  161 |   expect(navigations).toBe(0);
  162 | });
  163 | 
```