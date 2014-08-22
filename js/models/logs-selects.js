define(function (require) {
  function range(min, max){
    var temp = [];

    for (var i = min; i <= max; i++) {
       temp.push(i);
    }

    return temp;
  }

  return {
    items: range(1, 20),
    pages: range(0, 4),
    directions: [1, -1],
    fields: ['date', 'connection', 'client_name','user_name'],
    exclude_fields: [false, true],
    take: [10, 20, 50, 100, 150, 200]
  };
});