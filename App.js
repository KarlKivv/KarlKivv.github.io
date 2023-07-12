// Gets audit data from graphQL server and formats it
async function fetchUserAuditRatio() {
    const upTransactions = await sendQuery(userUpXpQuery);
    const downTransactions = await sendQuery(userDownXpQuery);

    if (!upTransactions.errors && !downTransactions.errors) {
        const auditMade = (upTransactions.data.transaction_aggregate.aggregate.sum.amount / 1000).toFixed(0)*1;
        const auditReceived = (downTransactions.data.transaction_aggregate.aggregate.sum.amount / 1000).toFixed(0)*1;
        const ratio = auditMade / auditReceived;
        return { auditMade, auditReceived, ratio };
    } else {
        return null;
    }
}

// Fetch API to interact with GraphQL server.
async function sendQuery(query) {
    return fetch("https://01.kood.tech/api/graphql-engine/v1/graphql", {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            query: query,
        })
    })
    .then((res) => {return res.json()});
  }