import axios from 'axios';

export default {

  searchPeople: (groupID, pattern) => {
    const url = `/groups/${groupID}/people_search`

    const params = {
      withCredentials: true,
      params: {
        contains: pattern
      }
    }

    return axios.get(url, params).then((resp) => resp.data)
  },

  addMembers: (groupID, peopleIds) => {
    console.log(peopleIds)
    const url = `/groups/${groupID}/add_people`
    const data = {people: peopleIds}
    const params = {withCredentials: true, data: data}

    return axios.post(url, params)
  },

  listMembers: (groupID, limit, includeTotal) => {
    const url = `/groups/${groupID}/members`

    const params = {
      withCredentials: true,
      params: {
        limit: limit,
        include_total: includeTotal
      }
    }

    return axios.get(url, params).then((r) => r.data)
  }

}
