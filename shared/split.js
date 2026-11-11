/**
 * Expense splitting logic using the Largest-Remainder Method.
 *
 * Guarantees:
 * 1. Each item's price is divided equally among its assigned members.
 * 2. Extras (tax, service charge) are distributed proportionally to each member's item subtotal.
 * 3. Exact to the last cent: sum of perMember shares ALWAYS equals subtotal + extras.
 * 4. No floating-point inaccuracies.
 */

/**
 * Splits an expense among members.
 *
 * @param {Object} params
 * @param {Array<{id?: string, name?: string, priceCents: number, memberIds: string[]}>} params.items
 * @param {number} [params.extrasCents=0] Extra charges (VAT, service fees) in cents
 * @returns {{ perMember: Record<string, number>, totalCents: number, subtotalCents: number, extrasCents: number }}
 */
export function splitExpense({ items = [], extrasCents = 0 }) {
  const normalizedExtras = Math.round(Number(extrasCents || 0));
  if (normalizedExtras < 0) {
    throw new Error('Extras cannot be negative');
  }

  // Map to collect item subtotal per member
  const itemSubtotals = {};
  // Track all unique members across items in order of appearance
  const allMembersList = [];
  const memberSet = new Set();

  let subtotalCents = 0;

  for (const item of items) {
    const price = Math.round(Number(item.priceCents || 0));
    if (price < 0) {
      throw new Error(`Item price cannot be negative: ${price}`);
    }

    const members = item.memberIds;
    if (!members || !Array.isArray(members) || members.length === 0) {
      throw new Error(`Item "${item.name || item.id || 'unnamed'}" must have at least one member assigned`);
    }

    subtotalCents += price;

    for (const m of members) {
      if (!memberSet.has(m)) {
        memberSet.add(m);
        allMembersList.push(m);
        itemSubtotals[m] = 0;
      }
    }

    // Divide item price among its members with remainder distribution
    const numMembers = members.length;
    const baseShare = Math.floor(price / numMembers);
    const remainder = price % numMembers;

    members.forEach((memberId, index) => {
      // Give 1 additional cent to the first 'remainder' members
      const share = baseShare + (index < remainder ? 1 : 0);
      itemSubtotals[memberId] += share;
    });
  }

  const totalCents = subtotalCents + normalizedExtras;

  // If there are no members, return empty
  if (allMembersList.length === 0) {
    if (normalizedExtras > 0) {
      throw new Error('Cannot allocate extras when there are no members');
    }
    return { perMember: {}, totalCents: 0, subtotalCents: 0, extrasCents: 0 };
  }

  // Calculate proportional extras using Largest-Remainder Method
  const perMember = {};

  if (normalizedExtras === 0) {
    for (const memberId of allMembersList) {
      perMember[memberId] = itemSubtotals[memberId];
    }
    return { perMember, totalCents, subtotalCents, extrasCents: 0 };
  }

  // If subtotal is 0 but extras > 0, split extras equally among all members
  if (subtotalCents === 0) {
    const numMembers = allMembersList.length;
    const baseExtra = Math.floor(normalizedExtras / numMembers);
    const extraRem = normalizedExtras % numMembers;

    allMembersList.forEach((memberId, index) => {
      perMember[memberId] = baseExtra + (index < extraRem ? 1 : 0);
    });
    return { perMember, totalCents, subtotalCents, extrasCents: normalizedExtras };
  }

  // Largest-Remainder Method (Hamilton-Hare) for proportional extras:
  // 1. Calculate each member's exact fractional quota of extras
  // 2. Give each member the integer floor of their quota
  // 3. Distribute remaining cents one-by-one in descending order of fractional parts
  let distributedExtras = 0;
  const quotas = allMembersList.map((memberId, index) => {
    const memberSubtotal = itemSubtotals[memberId];
    // Exact quota in cents (can be fractional)
    const exactShare = (normalizedExtras * memberSubtotal) / subtotalCents;
    const integerPart = Math.floor(exactShare);
    const fractionalPart = exactShare - integerPart;
    distributedExtras += integerPart;

    return {
      memberId,
      originalIndex: index,
      integerPart,
      fractionalPart,
    };
  });

  let remainingCents = normalizedExtras - distributedExtras;

  // Sort descending by fractional part. If equal, preserve original appearance order
  quotas.sort((a, b) => {
    if (Math.abs(b.fractionalPart - a.fractionalPart) > 1e-9) {
      return b.fractionalPart - a.fractionalPart;
    }
    return a.originalIndex - b.originalIndex;
  });

  // Assign the leftover cents
  const extraShares = {};
  quotas.forEach((q, rank) => {
    const extraCent = rank < remainingCents ? 1 : 0;
    extraShares[q.memberId] = q.integerPart + extraCent;
  });

  // Combine subtotal + extra share for each member
  for (const memberId of allMembersList) {
    perMember[memberId] = itemSubtotals[memberId] + extraShares[memberId];
  }

  return {
    perMember,
    totalCents,
    subtotalCents,
    extrasCents: normalizedExtras,
  };
}

