var w = 1000
var h = 1000
var scale = 10

var width = Math.floor(w/scale)
var height = Math.floor(h/scale)
var grid = [...Array(width)].map(e => Array(height));
var groupColours = []

var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')
canvas.width = width*scale
canvas.height = height*scale

var checkBox = document.getElementById('check')
var spreadFast = checkBox.checked
checkBox.onchange = e => {
	spreadFast = checkBox.checked
}

// MAIN IMPORTANT VERSATILE HASH FUNCTION
async function getHashBits(string, bitsArray) {
	const textEncoder = new TextEncoder()
	const arrayBuffer = textEncoder.encode(string)
	const digest = await crypto.subtle.digest('SHA-1', arrayBuffer)
	if (bitsArray.reduce((a,b) => a + b, 0) > digest.length*8) throw 'Too many bits for digest size.'
	const bytes = new Uint8Array(digest)

	let bitIndex = 0
	let result = []
	
	for (let i = 0; i < bitsArray.length; i++) {
		let bits = bitsArray[i]
		let value = 0
		for (let j = 0; j < bits; j++) {
			let byte = bytes[Math.floor(bitIndex/8)]
			let bit = (byte >> (bitIndex % 8)) & 1
			value = (value << 1) + bit
			bitIndex++
		}
		result.push(value)
	}

	return result
}


// FUNCTIONS WHICH TURN HASHES INTO DIRECTIONS
async function coordsToDirections(x, y) {
	let direction = (await getHashBits(`${x},${y}`, [2]))[0]
	let result = Array(4).fill(false)
	result[direction] = true
	return result
}

async function coordsToDirections4(x, y) {
	let directions = await getHashBits(`${x},${y}`, [3,3])
	let result = Array(4).fill(false)
	result[directions[0]] = true
	result[directions[1]] = true
	return result
}

async function coordsToDirections3(x, y) {
	let direction = (await getHashBits(`${x},${y}`, [3]))[0]
	let result = Array(4).fill(false)
	var c = [0, 0, 0, 1, 2, 2, 2, 3]
	result[c[direction]] = true
	return result
}

async function coordsToDirections2(x, y) {
	let bits = await getHashBits(`${x},${y}`, [2,2,2,2])
	return bits.map(e => e === 0)
}




var col = 0
function getRandomColor() {
	// return '#'+Math.floor(Math.random()*16777215).toString(16)
	// return `hsla(${Math.random() * 360}, 100%, 50%, 1)`
	col += 50
	return `hsla(${col}, 100%, 50%, 1)`
}




canvas.onclick = e => {
	let x = Math.floor(e.offsetX / scale)
	let y = Math.floor(e.offsetY / scale)
	groupColours.push(getRandomColor())
	spread4Directions(x, y, groupColours.length-1)
}



async function spread4Directions(x, y, group) {
	grid[y][x] = group
	ctx.clearRect(x*scale, y*scale, scale, scale)
	ctx.fillStyle = groupColours[group]
	ctx.fillRect(x*scale, y*scale, scale, scale)
	
	let cellDirections = await coordsToDirections(x, y)
	let directions = [[0, -1], [1, 0], [0, 1], [-1, 0]]
	for (let i=0; i<4; i++) {
		let nx = x + directions[i][0]
		let ny = y + directions[i][1]
		if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
			
			let otherCellDirections = await coordsToDirections(nx, ny)
			let thisCellLinks = cellDirections[i]
			let otherCellLinks = otherCellDirections[(i+2)%4]
			
			// if (thisCellLinks || otherCellLinks) {
			// 	if (thisCellLinks) {
			// 		ctx.setLineDash([])
			// 	} else {
			// 		ctx.setLineDash([1,1])
			// 	}
			// 	ctx.strokeStyle = '#000'
			// 	// ctx.strokeStyle = groupColours[group]
			// 	ctx.lineWidth = 2
			// 	ctx.lineCap = 'butt'
			// 	ctx.beginPath()
			// 	ctx.moveTo((x+0.5)*scale, (y+0.5)*scale)
			// 	ctx.lineTo((x+nx+1)*0.5*scale, (y+ny+1)*0.5*scale)
			// 	ctx.stroke()
			// }
			
			if (grid[ny][nx] !== grid[y][x]) {
				// let otherCellHashBits = await coordsToBits(x, y)
				if (thisCellLinks || otherCellLinks) {
					if (!spreadFast) {
						await new Promise(resolve => setTimeout(resolve, 50));
					}
					await spread4Directions(nx, ny, group)
				}
			}
		}
	}
}


// for (let i=0; i<500; i++) {
// 	let x = Math.floor(Math.random()*width)
// 	let y = Math.floor(Math.random()*height)
	
// 	groupColours.push(getRandomColor())
// 	addCellToGroupAndCheckNeighbours(x, y, groupColours.length-1)
// }

async function main() {
	for (let y=0; y<width; y+=1) {
		for (let x=0; x<height; x+=1) {
			if (typeof grid[y][x] === 'undefined') {
				groupColours.push(getRandomColor())
				await spread4Directions(x, y, groupColours.length-1)
			}
		}
	}
}

main()

