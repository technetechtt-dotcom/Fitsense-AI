# Kimberley retailer recruitment

FitSense cannot sign a commercial retailer from this repository. This pack is the operator brief to recruit **one** Kimberley / Northern Cape school or safety footwear store.

## Offer (one paragraph)

FitSense measures feet on a phone in millimetres using a printed A4 or bank-card reference (or AR when the device supports it). During a 6-week **assisted vs control** pilot we compare size-related returns. No invented millimetres; low-confidence scans withhold a retail size.

## Outreach list (edit with real names)

| Store                                 | Contact | Phone / email | Status        | Notes                             |
| ------------------------------------- | ------- | ------------- | ------------- | --------------------------------- |
| TBD — school outfitter, Kimberley CBD |         |               | not_contacted | Prefer POS that can POST outcomes |
| TBD — safety / industrial footwear    |         |               | not_contacted | Width fittings (D/EE) matter      |
| TBD — sports retail                   |         |               | not_contacted | Brand-fit deltas                  |

## First meeting checklist

1. Show Scan + withheld-size behaviour (not a fake mm demo).
2. Walk POPIA DPA template (`docs/legal/POPIA_DPA_TEMPLATE.md`).
3. Confirm they can export catalogue CSV or JSON feed (`sizeRangeEu` mandatory).
4. Agree assisted vs control days.
5. Record interest in `docs/records/kimberley-retailer-pipeline.md` (copy this table).

## After a yes

1. `PUT /v1/compliance/operator-agreements` with signed document ref.
2. Ingest catalogue + store inventory (`locationId`).
3. Mark billing `onboardingStep=popia_signed` then `pos_integrated`.
4. Flip `pilot-contracts` status to `active` with dates.
5. File GitHub issue “Retailer onboarded: {name}”.

Do not mark the commercial pilot “live” until the 30-person Brannock study is certified (`docs/records/accuracy-report-latest.md` Certified = YES).
