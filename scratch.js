const text = 'परियोजना'; const res = text.replace(/([\u0900-\u097f](?:्[\u0900-\u097f])*)ि/g, 'ि$1'); console.log(res); console.log([...res].map(c=>c.charCodeAt(0).toString(16)).join(' '));
