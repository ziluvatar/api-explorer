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
    fields: ['at', 'c', 'cn','un'],
    exclude_fields: [false, true]
  };
});