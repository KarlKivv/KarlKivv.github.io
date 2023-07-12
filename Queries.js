const userQuery = `{
  user { 
    id 
    login
    firstName
    lastName
	}
}`

const userXpQuery = `{
  transaction_aggregate(
    where: {
      _and: [
        {
          _or: [
            {object: {type: {_eq: "project"}}},
            {object: {type: {_eq: "piscine"}}},
          ]
        }, 
        {type: {_eq: "xp"}}, 
        {eventId: {_eq: 20}}]
    }
  ) {
    aggregate {
      sum {
        amount
      }
    }
  }
}`

const userUpXpQuery = `{
  transaction_aggregate(
    where: {
      _and: [
        {
          _or: [
            {object: {type: {_eq: "project"}}},
            {object: {type: {_eq: "piscine"}}},
          ]
        }, 
        {type: {_eq: "up"}}, 
        {eventId: {_eq: 20}}]
    }
  ) {
    aggregate {
      sum {
        amount
      }
    }
  }
}`

const userDownXpQuery = `{
  transaction_aggregate(
    where: {
      _and: [
        {
          _or: [
            {object: {type: {_eq: "project"}}},
            {object: {type: {_eq: "piscine"}}},
          ]
        }, 
        {type: {_eq: "down"}}, 
        {eventId: {_eq: 20}}]
    }
  ) {
    aggregate {
      sum {
        amount
      }
    }
  }
}`

const XpPerName = `{
  transaction(
    where: {
      _and: [
        {
          _or: [
            {object: {type: {_eq: "project"}}},
            {object: {type: {_eq: "piscine"}}},
          ]
        }, 
        {type: {_eq: "xp"}},
        {eventId: {_eq: 20}},
      ]
    }, 
    order_by: {
      createdAt:asc
    }
  ) {
    object {
      name
    }
    createdAt
    amount
    type
  }
}`