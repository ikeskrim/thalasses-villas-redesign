# Ελληνικά — γλωσσάρι και κανόνες φωνής

**The spine of the Greek corpus.** Every file under `content/el/` follows this,
and every translator — human or otherwise — reads it before touching a string.

It exists because the Greek was produced in parallel across eight domains, and
eight people translating the same brand without a shared glossary produce eight
brands. Consistency is not a nicety here: "private beach" rendered three
different ways across three pages is the single clearest way to make a luxury
property look like a template.

**Everything in `content/el/` is `copyStatus: "draft"`.** The owner reads Greek
natively; this is a first draft for his eye, not a shipped translation. Nothing
renders on a public route until he has been through it.

---

## 1. Τι ΔΕΝ μεταφράζεται

Left in Latin, always, no exceptions:

| | |
|---|---|
| `Thalasses Villas`, `Thalasses` | The brand. |
| `Villa Thoi`, `Villa Persi`, `Villa Eeanthe`, `Villa Melia`, `Villa Pueblo` | Villa proper nouns. `content/url-map.md` §5.3: these almost certainly keep their Latin forms, and it is the **owner's** decision, not a transliteration a translator makes alone. |
| `Thalasses Rituals` | The venue. |
| `1041K91003163701` | The operating licence. Legally displayed verbatim. |
| `info@thalasses.com`, `creteholidayhome@gmail.com` | Addresses. |
| `(+30) 6974069475`, `(+30) 2114445757` | Telephone. |
| `reserve-online.net` and every booking URL | Breaks the engine. |
| Brand names inside amenity text — `Smeg`, `Nespresso`, `Nintendo Wii`, `Schüco`, `Kährs`, `EMU` | Manufacturers. |
| `Condé Nast Traveller` and other publication names | Press. |

**Numerals are never touched.** 9 bedrooms stays 9, 50 m stays 50 m, 35€
stays 35€, 240 m² stays 240 m². Every figure on this site resolves against the
locked capacity table; a translated numeral is a broken one.

Greek uses a comma as the decimal separator, and the temptation is to convert
`72.8 km` to `72,8 χλμ`. **Do not.** These figures are compared against the
registry by an automated guard, and the guard reads the numeral.

## 2. Πρόσωπο και ύφος

**Δεύτερο πρόσωπο, πληθυντικός ευγενείας.** *"η βεράντα σας"*, όχι *"η βεράντα
του επισκέπτη"* και όχι *"η βεράντα σου"*. Ο πληθυντικός είναι το φυσικό ύφος
της ελληνικής φιλοξενίας σε αυτό το επίπεδο· ο ενικός ακούγεται οικείος με
τρόπο που δεν έχει κερδηθεί.

**Ενεστώτας.** *"Η θάλασσα φτάνει στο μπαλκόνι"*, όχι *"θα φτάνει"*.

## 3. Οι τρεις κανόνες της φωνής, στα ελληνικά

Οι ίδιοι κανόνες με τα αγγλικά (`CONVENTIONS.md` §17), γιατί είναι κανόνες για
το τι λέει το κείμενο, όχι για τη γλώσσα του.

**Υποτονισμός.** Καμία υπερβολή. Απαγορεύονται: *υπέροχος, μαγευτικός,
παραδεισένιος, ονειρικός, μοναδική εμπειρία, πολυτελέστατος, εκπληκτικός,
απαράμιλλος*. Η πολυτέλεια υπονοείται από τα συγκεκριμένα — ένα τραπέζι για
δεκαοκτώ, μια παραλία χωρίς ξένες πετσέτες — και υπονομεύεται από τα επίθετα
που τη διεκδικούν.

Το αγγλικό πρωτότυπο κάνει ήδη αυτή τη δουλειά. **Η μετάφραση δεν προσθέτει
θερμοκρασία που δεν υπάρχει στο πρωτότυπο.** Αν το αγγλικό λέει *"Two bedrooms
sleeping four in beds"*, το ελληνικό λέει *"Δύο υπνοδωμάτια, τέσσερις σε
κρεβάτια"* — όχι *"δύο άνετα υπνοδωμάτια που φιλοξενούν άνετα τέσσερις"*.

**Συγκεκριμένα ουσιαστικά, ρήματα των αισθήσεων.** Κολύμπι, πύλη, φως, αλάτι,
άμμος, βεράντα, πεζούλι. Όχι *χώροι, εγκαταστάσεις, παροχές* όπου υπάρχει
συγκεκριμένη λέξη.

**Σύντομες καταφατικές, και μία μεγάλη λυρική πρόταση ανά ενότητα.** Ο ρυθμός
είναι το αποτέλεσμα· ομοιόμορφο μήκος προτάσεων διαβάζεται σαν φυλλάδιο.

## 4. Η ρήτρα — το `-οντας`

Η υπογραφή του σχεδιασμού είναι μια ρήτρα σε δύο μέρη: ένα γερούνδιο σε μεγάλο
μέγεθος, και μια ουρά με αραιωμένα κεφαλαία δίπλα του. **Στα ελληνικά το
γερούνδιο γίνεται μετοχή σε `-οντας`/`-ώντας`**, που είναι ακριβώς η ίδια
κίνηση: μια πράξη σε εξέλιξη, χωρίς υποκείμενο, χωρίς τελεία.

| αγγλικά | ελληνικά | σημείωση |
|---|---|---|
| Living / Unlimited | **Ζώντας** / ΧΩΡΙΣ ΟΡΙΑ | Η κεντρική ρήτρα του σήματος. |
| Waking / At sea level, ground floor | **Ξυπνώντας** / ΣΤΟ ΕΠΙΠΕΔΟ ΤΗΣ ΘΑΛΑΣΣΑΣ, ΙΣΟΓΕΙΟ | |
| Bathing / In the largest bathroom | **Κάνοντας μπάνιο** / ΣΤΟ ΜΕΓΑΛΥΤΕΡΟ ΛΟΥΤΡΟ | |
| Waking / On the upper floor, three rooms | **Ξυπνώντας** / ΣΤΟΝ ΕΠΑΝΩ ΟΡΟΦΟ, ΤΡΙΑ ΔΩΜΑΤΙΑ | |
| Stepping / From bed into the pool | **Περνώντας** / ΑΠΟ ΤΟ ΚΡΕΒΑΤΙ ΣΤΗΝ ΠΙΣΙΝΑ | |
| Retreating / Adults only, direct beach access | **Αποσυρόμενοι** / ΜΟΝΟ ΕΝΗΛΙΚΕΣ, ΑΜΕΣΗ ΠΡΟΣΒΑΣΗ ΣΤΗΝ ΠΑΡΑΛΙΑ | Δεν υπάρχει φυσική μετοχή σε -οντας· **σημειωμένο για τον ιδιοκτήτη**. |
| Gathering / All four, one gate | **Μαζεύοντας** / ΚΑΙ ΟΙ ΤΕΣΣΕΡΙΣ, ΜΙΑ ΠΥΛΗ | |
| Marrying / On sand, beside the water | **Παντρεύοντας** / ΣΤΗΝ ΑΜΜΟ, ΔΙΠΛΑ ΣΤΟ ΝΕΡΟ | Αδέξιο· εναλλακτική **Παντρεύοντας → «Στεφανώνοντας»**. **σημειωμένο**. |
| Asking / For any of the following | **Ζητώντας** / ΟΤΙΔΗΠΟΤΕ ΑΠΟ ΤΑ ΠΑΡΑΚΑΤΩ | |
| Wandering / South, forty minutes | **Περιπλανώμενοι** / ΝΟΤΙΑ, ΣΑΡΑΝΤΑ ΛΕΠΤΑ | Δεν υπάρχει φυσική μετοχή· **σημειωμένο**. |
| Swimming / Ammoudaki, then Klisidi | **Κολυμπώντας** / ΑΜΜΟΥΔΑΚΙ, ΜΕΤΑ ΚΛΗΣΙΔΙ | |
| Standing / Fifty metres from the water | **Στέκοντας** / ΠΕΝΗΝΤΑ ΜΕΤΡΑ ΑΠΟ ΤΟ ΝΕΡΟ | |
| Looking / For something that moved | **Ψάχνοντας** / ΚΑΤΙ ΠΟΥ ΜΕΤΑΚΙΝΗΘΗΚΕ | Σελίδα 404. |
| Building / Six tokens, two faces | **Χτίζοντας** / ΕΞΙ ΣΥΜΒΟΛΑ, ΔΥΟ ΓΡΑΜΜΑΤΟΣΕΙΡΕΣ | Styleguide. |

**Τρεις ρήτρες δεν έχουν φυσική μετοχή σε `-οντας`** και είναι σημειωμένες με
`gerundNote` στο `content/el/villa-page-copy.json` και στο `content/el/home.json`.
Η ελληνική μετοχή δεν σχηματίζεται από κάθε ρήμα, και μια αναγκασμένη μετοχή
ακούγεται σαν μετάφραση. **Ο ιδιοκτήτης αποφασίζει** — δεν το κρύβουμε πίσω από
μια λέξη που δεν λέγεται.

**Η ουρά είναι πάντα κεφαλαία και αραιωμένη.** Στα ελληνικά τα κεφαλαία **δεν
τονίζονται**: ΧΩΡΙΣ ΟΡΙΑ, όχι ΧΩΡΊΣ ΌΡΙΑ. Εξαίρεση το διαλυτικό, που κρατιέται.

## 5. Το γλωσσάρι — μία απόδοση, πάντα η ίδια

| αγγλικά | ελληνικά |
|---|---|
| private beach | ιδιωτική παραλία |
| seafront | παραθαλάσσιο / στο μέτωπο της θάλασσας |
| the estate | το κτήμα |
| villa | βίλα |
| the collection | η συλλογή |
| bedroom | υπνοδωμάτιο |
| bathroom | λουτρό |
| twin room | δίκλινο με μονά κρεβάτια |
| double | διπλό |
| sleeps 4 (in beds) | κοιμούνται 4 (σε κρεβάτια) |
| private pool | ιδιωτική πισίνα |
| heated pool | θερμαινόμενη πισίνα |
| terrace | βεράντα |
| balcony | μπαλκόνι |
| sun loungers | ξαπλώστρες |
| ground floor | ισόγειο |
| upper floor | επάνω όροφος |
| the gate | η πύλη |
| helipad | ελικοδρόμιο |
| concierge | κονσιέρζ |
| Holiday Advisor | Σύμβουλος Διακοπών |
| cleaning every 3 days | καθαρισμός κάθε 3 ημέρες |
| reception desk | ρεσεψιόν |
| your stay includes | η διαμονή σας περιλαμβάνει |
| arranged on request | κατόπιν αιτήματος |
| on request, extra charge | κατόπιν αιτήματος, με επιπλέον χρέωση |
| booking / to book | κράτηση / κάνετε κράτηση |
| check availability | δείτε διαθεσιμότητα |
| enquire | επικοινωνήστε |
| experiences | εμπειρίες |
| wedding venue | χώρος γάμων |
| Good to know | Καλό να ξέρετε |
| Also on the property | Επίσης στο κτήμα |
| The four houses | Τα τέσσερα σπίτια |
| in detail | αναλυτικά |
| The Inventory | Ο κατάλογος |
| photographed | φωτογραφημένο |
| more photographs | περισσότερες φωτογραφίες |

**Breakfast — προσοχή.** Το πρωινό **δεν περιλαμβάνεται**· έχει επιπλέον χρέωση
(επιβεβαιωμένο από τον ιδιοκτήτη, T-245). Κάθε αναφορά σε πρωινό διατυπώνεται
ως *«κατόπιν αιτήματος, με επιπλέον χρέωση»* και **ποτέ** με τρόπο που υπονοεί
ότι περιλαμβάνεται. Το *«Πρωινό στην παραλία»* παραμένει εμπειρία με κράτηση.

## 6. Τι σημειώνεται για τον ιδιοκτήτη

Κάθε αρχείο έχει πεδίο `notes[]`. Εκεί μπαίνει:

- κάθε ρήτρα χωρίς φυσική μετοχή σε `-οντας`
- κάθε όρος με δύο εύλογες αποδόσεις, με την εναλλακτική γραμμένη
- κάθε σημείο όπου το αγγλικό είναι διφορούμενο και η ελληνική μετάφραση
  **αναγκάζεται** να διαλέξει — η ελληνική έχει γένος και πτώσεις, οπότε μια
  αγγλική πρόταση χωρίς υποκείμενο συχνά δεν μεταφράζεται χωρίς απόφαση
- **τα νομικά.** Οι όροι χρήσης φέρουν `[legal draft — owner review mandatory]`.
  Δεν είναι μετάφραση για δημοσίευση: είναι κείμενο εργασίας για δικηγόρο. Το
  αγγλικό πρωτότυπο κατονομάζει άλλη εταιρεία επτά φορές και βρίσκεται ήδη υπό
  νομικό έλεγχο.
