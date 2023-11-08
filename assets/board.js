/*jslint this*/
function Board(maxRow, maxCol) {
    const self = Object.create(this);
    let board = new Array(maxRow).fill(0).map(() => new Array(maxCol).fill(0));
    const indexFrom = (row, col) => (row * maxCol) + col + 1;
    function getConsecutiveItems(position) {
        const moves = [[1, 0], [0, 1], [1, 1], [1, -1]];
        let groups = [];
        const [row, col] = position;
        if (board[row][col] === 0) {
            return [];
        }
        moves.forEach(function ([deltaRow, deltaCol]) {
            let items = [];
            let groupLength;
            const symetricFactors = [1, -1];
            symetricFactors.forEach(function (factor) {
                const colIncrement = deltaCol * factor;
                const rowIncrement = deltaRow * factor;
                let tmp = [];
                let nextCol = col + colIncrement;
                let nextRow = row + rowIncrement;
                while (
                    board[nextRow] !== undefined &&
                    board[nextRow][nextCol] !== undefined
                ) {
                    if (board[nextRow][nextCol] === board[row][col]) {
                        tmp[tmp.length] = [nextRow, nextCol];
                    } else {
                        break;
                    }
                    nextRow += rowIncrement;
                    nextCol += colIncrement;
                }
                items[items.length] = tmp;
            });
            groupLength = items[0].concat(items[1]).length;
            if (groupLength >= 3) {
                groupLength = items[0].concat([position]).concat(items[1]);
                groups[groups.length] = groupLength.reduce(
                    function (acc, item) {
                        if (acc.length === 4) {
                            return acc;
                        }
                        return acc.concat([item]);
                    },
                    []
                );
            } else {
                groups[groups.length] = [position].concat(items[0]);
                groups[groups.length] = [position].concat(items[1]);
            }
        });
        return groups.reduce(function (acc, group) {
            if (acc.length > group.length) {
                return acc;
            }
            return group;
        });
    }
    function rowColFrom(index) {
        let row;
        let col;
        if (index > 0) {
            col = (index - 1) % 7;
            row = Math.trunc((index - 1) / 7);
        }
        return [row, col];
    }
    function getSelectablePosition(index) {
        let selectableRow = maxRow - 1;
        let [row, col] = rowColFrom(index);
        if (row === undefined || col === undefined) {
            return null;
        }
        while (selectableRow >= 0) {
            if (board[selectableRow][col] === 0) {
                return [selectableRow, col];
            }
            selectableRow -= 1;
        }
        return null;
    }
    self.getMatrix = () => board;
    self.getBoardIndexes = () => board.reduce(function (acc, row) {
        const rowIndex = acc.length;
        return acc.concat(row.map((ignore, index) => rowIndex + index));
    }, []);
    self.getIndexFrom = (row, col) => indexFrom(row, col) - 1;
    self.init = function () {
        board = new Array(maxRow).fill(0).map(() => new Array(maxCol).fill(0));
    };
    self.isFilled = () => board.every((row) => row.every((val) => val !== 0));
    self.requestDiscSelection = function discSelection(index, value) {
        let row;
        let col;
        const position = getSelectablePosition(index);
        const response = {
            consecutiveItems: () => [],
            getIndex: () => null
        };
        if (position !== null) {
            [row, col] = position;
            board[row][col] = value;
            response.getIndex = () => indexFrom(row, col) - 1;
            response.consecutiveItems = () => getConsecutiveItems([row, col]);
        }
        return response;
    };
    return self;
}

export default Object.freeze(Board);
