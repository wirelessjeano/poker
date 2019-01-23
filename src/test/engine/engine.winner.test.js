import { Card, Deck } from '../../util/deck';
import { getWinner } from '../../util/engine.js';
import { createHand } from '../../util/helpers';
require('dotenv').config();

const stressMultiplier = process.env.STRESS_TEST_MULTIPLIER; // determines loop size for stress tests

const deck = new Deck();

let playerData, tableCards;

describe('getWinner tests', () => {

  beforeEach(() => {
    deck.reset();
    playerData = {
      player: { id: 'player', active: true, hand: [] },
      ai1: { id: 'ai1', active: true, hand: [] },
      ai2: { id: 'ai2', active: true, hand: [] },
      ai3: { id: 'ai3', active: true, hand: [] },
    };
    tableCards = [];
  })

  test("should return active player's score object when only one player is active (not folded)", () => {
    playerData.ai1.active = playerData.ai2.active = playerData.ai3.active = false;
    playerData.player.hand = createHand([2, 2], ['h', 's']);
    tableCards = createHand([3, 4, 6, 8, 8], ['h','c','s','s','d']);
    const testScoreObj = getWinner(playerData, tableCards);
    expect(testScoreObj).toMatchObject({
      type: expect.any(String),
      score: expect.any(Number),
      cardsUsed: expect.any(Array),
      highHandCards: expect.any(Array),
      owner: expect.any(String),
    });
    expect(testScoreObj.owner).toEqual('player');
  });

  test("should determine a winner between 2 players with very different hands", () => {
    playerData.ai1.active = playerData.ai2.active = false;

    playerData.player.hand = createHand([2, 2], ['h', 's']); // full house 2s over 8s
    playerData.ai3.hand = createHand([8, 6], ['h', 'c']); // 3 of a kind
    tableCards = createHand([2, 3, 5, 8, 8], ['d','c','s','s','d']);
    let testScoreObj = getWinner(playerData, tableCards);
    expect(testScoreObj.owner).toEqual('player');

    playerData.player.hand = createHand([2, 2], ['h', 's']); // 4 of a kind
    playerData.ai3.hand = createHand([8, 6], ['h', 'c']); // 2 pair
    tableCards = createHand([2, 2, 10, 8, 10], ['d','c','s','s','d']);
    testScoreObj = getWinner(playerData, tableCards);
    expect(testScoreObj.owner).toEqual('player');
  });

  test("should determine a winner between 2 players with similar hands", () => {
    playerData.ai1.active = playerData.ai2.active = false;

    playerData.player.hand = createHand([4, 2], ['h', 's']); // 9-high straight
    playerData.ai3.hand = createHand([8, 10], ['h', 'c']); // 10-high straight
    tableCards = createHand([5, 6, 7, 8, 9], ['d','c','s','s','d']);
    let testScoreObj = getWinner(playerData, tableCards);
    expect(testScoreObj.owner).toEqual('ai3');

    playerData.player.hand = createHand([13, 12], ['h', 's']); // full house Aces over Kings
    playerData.ai3.hand = createHand([12, 12], ['h', 'c']); // full house Aces over Queens
    tableCards = createHand([14, 14, 14, 13, 4], ['d','c','s','s','d']);
    testScoreObj = getWinner(playerData, tableCards);
    expect(testScoreObj.owner).toEqual('player');

    playerData.player.hand = createHand([8, 7], ['h', 's']); // 2 pair 8s over 7s
    playerData.ai3.hand = createHand([8, 5], ['c', 'c']); // 2 pair 8s over 5s
    tableCards = createHand([8, 7, 5, 13, 4], ['d','c','s','s','d']);
    testScoreObj = getWinner(playerData, tableCards);
    expect(testScoreObj.owner).toEqual('player');

    playerData.player.hand = createHand([9, 2], ['c', 'c']); // flush king-high (high 9 in hole)
    playerData.ai3.hand = createHand([12, 5], ['c', 'c']); // flush king-high (high queen in hole)
    tableCards = createHand([3, 7, 13, 13, 4], ['c','c','c','s','d']);
    testScoreObj = getWinner(playerData, tableCards);
    expect(testScoreObj.owner).toEqual('ai3');
  });

  test("should determine a winner between 3 players", () => {
    playerData.ai1.active = false;

    // far off
    playerData.player.hand = createHand([8, 8], ['h', 's']); // 4 of a kind
    playerData.ai2.hand = createHand([4, 13], ['h', 'c']); // high card
    playerData.ai3.hand = createHand([6, 6], ['h', 'c']); // 3 of a kind
    tableCards = createHand([2, 3, 6, 8, 8], ['d','c','s','c','d']);
    let testScoreObj = getWinner(playerData, tableCards);
    expect(testScoreObj.owner).toEqual('player');

    // close
    playerData.player.hand = createHand([11, 11], ['h', 'c']); // 2 pair Queens over Jacks
    playerData.ai2.hand = createHand([10, 5], ['h', 'c']); // 2 pair Queens over 10s
    playerData.ai3.hand = createHand([13, 4], ['h', 's']); // 2 pair Kings over Queens
    tableCards = createHand([2, 10, 13, 12, 12], ['d','c','s','s','d']);
    testScoreObj = getWinner(playerData, tableCards);
    expect(testScoreObj.owner).toEqual('ai3');
  })

  test("should determine a winner between 4 players", () => {
    
    playerData.player.hand = createHand([9, 9], ['h', 'c']); // 2 pair Queens over 9s
    playerData.ai1.hand = createHand([11, 11], ['h', 'c']); // 2 pair Queens over Jacks
    playerData.ai2.hand = createHand([10, 5], ['h', 'c']); // 2 pair Queens over 10s
    playerData.ai3.hand = createHand([13, 4], ['h', 's']); // 2 pair Kings over Queens
    tableCards = createHand([2, 10, 13, 12, 12], ['d','c','s','s','d']);
    const testScoreObj = getWinner(playerData, tableCards);
    expect(testScoreObj.owner).toEqual('ai3');
  })
});

describe('kicker card tiebreaker tests', () => {

  beforeEach(() => {
    deck.reset();
    playerData = {
      player: { id: 'player', active: true, hand: [] },
      ai1: { id: 'ai1', active: true, hand: [] },
      ai2: { id: 'ai2', active: true, hand: [] },
      ai3: { id: 'ai3', active: true, hand: [] },
    };
  });

  // will not work until kicker logic is in place
  xtest(`should always pick a winner (${stressMultiplier}x stress test)`, () => {
    for (let i = 0; i < stressMultiplier; i++) {
      deck.reset();
      playerData.player.hand = [deck.dealCard(), deck.dealCard()];
      playerData.ai1.hand = [deck.dealCard(), deck.dealCard()];
      playerData.ai2.hand = [deck.dealCard(), deck.dealCard()];
      playerData.ai3.hand = [deck.dealCard(), deck.dealCard()];
      const tableCards = new Array(5).fill(null).map(e => deck.dealCard());
      const stressScoreObject = getWinner(playerData, tableCards);
      expect(stressScoreObject).toMatchObject({
        type: expect.any(String),
        score: expect.any(Number),
        cardsUsed: expect.any(Array),
        highHandCards: expect.any(Array),
        owner: expect.any(String),
      });
    }
  });

  describe('four of a kind tiebreaker tests', () => {

    test('should determine a winner by kicker when 4 of a kind is on the table' , () => {
      playerData.player.hand = createHand([10, 9], ['h', 'c']); // beats table
      playerData.ai1.hand = createHand([6, 11], ['h', 'c']);  // loses to player
      playerData.ai2.hand = createHand([11, 5], ['d', 'c']);  // beats player
      playerData.ai3.hand = createHand([12, 3], ['h', 's']); // beats table & ai2
      let tableCards = createHand([7, 4, 4, 4, 4], ['d','c','s','h','d']);
      let testScoreObj = getWinner(playerData, tableCards);
      expect(testScoreObj.owner).toEqual('ai3');
      expect(testScoreObj.score).toEqual(7);
    });

    test('should call a draw when 4 of a kind is on the table and the high card is on the table' , () => {
      playerData.player.hand = createHand([9, 9], ['h', 'c']);
      playerData.ai1.hand = createHand([10, 11], ['h', 'c']);
      playerData.ai2.hand = createHand([9, 5], ['d', 'c']);
      playerData.ai3.hand = createHand([12, 3], ['h', 's']);
      let tableCards = createHand([13, 14, 14, 14, 14], ['d','c','s','h','d']);
      let testScoreObj = getWinner(playerData, tableCards);
      // NO DRAW LOGIC YET
      expect(testScoreObj).toEqual('table_win_placeholder');
    });

    test('should call a draw when 4 of a kind is on the table and 2 players had the same high kicker in the hole' , () => {
      playerData.player.hand = createHand([9, 9], ['h', 'c']); // pair doesn't mean squat here
      playerData.ai1.hand = createHand([8, 2], ['h', 'c']);
      playerData.ai2.hand = createHand([9, 5], ['d', 'c']);
      playerData.ai3.hand = createHand([4, 3], ['h', 's']);
      let tableCards = createHand([3, 14, 14, 14, 14], ['d','c','s','h','d']);
      let testScoreObj = getWinner(playerData, tableCards);
      // NO DRAW LOGIC YET
      expect(testScoreObj).toEqual('true_draw_placeholder');
    });

  });

  describe('three of a kind tiebreaker tests', () => {

    test('should determine a winner when 3 of a kind is on the table', () => {
      playerData.player.hand = createHand([9, 4], ['h', 'c']); 
      playerData.ai1.hand = createHand([8, 2], ['h', 'c']);
      playerData.ai2.hand = createHand([11, 5], ['d', 'c']);
      playerData.ai3.hand = createHand([4, 3], ['h', 's']);
      let tableCards = createHand([7, 14, 14, 14, 10], ['d','c','s','h','d']);
      let testScoreObj = getWinner(playerData, tableCards);
      expect(testScoreObj.owner).toEqual('ai2');
      playerData.player.hand = createHand([11, 4], ['h', 'c']); 
      playerData.ai1.hand = createHand([8, 2], ['h', 'c']);
      playerData.ai2.hand = createHand([4, 5], ['d', 'c']);
      playerData.ai3.hand = createHand([4, 7], ['h', 's']);
      tableCards = createHand([13, 3, 3, 3, 10], ['d','c','s','h','d']);
      testScoreObj = getWinner(playerData, tableCards);
      expect(testScoreObj.owner).toEqual('player');
    });

    test('should call a draw when 3 of a kind is on the table and the 2 high kickers are on the table', () => {
      playerData.player.hand = createHand([9, 4], ['h', 'c']); 
      playerData.ai1.hand = createHand([8, 2], ['h', 'c']);
      playerData.ai2.hand = createHand([11, 5], ['d', 'c']);
      playerData.ai3.hand = createHand([4, 3], ['h', 's']);
      let tableCards = createHand([12, 14, 14, 14, 13], ['d','c','s','h','d']);
      let testScoreObj = getWinner(playerData, tableCards);
      expect(testScoreObj).toEqual('table_win_placeholder');
      playerData.player.hand = createHand([9, 4], ['h', 'c']); 
      playerData.ai1.hand = createHand([8, 2], ['h', 'c']);
      playerData.ai2.hand = createHand([11, 5], ['d', 'c']);
      playerData.ai3.hand = createHand([4, 3], ['h', 's']);
      tableCards = createHand([12, 14, 14, 14, 13], ['d','c','s','h','d']);
      testScoreObj = getWinner(playerData, tableCards);
      expect(testScoreObj).toEqual('table_win_placeholder');
    });

    test('should determine a winner when 2 players have the same three of a kind', () => {
      playerData.player.hand = createHand([14, 8], ['h', 'd']); // 3 oak, kicker 10
      playerData.ai1.hand = createHand([14, 8], ['d', 'c']);
      playerData.ai2.hand = createHand([11, 5], ['d', 'c']); // a pair
      playerData.ai3.hand = createHand([4, 3], ['h', 's']); // a pair
      let tableCards = createHand([7, 14, 14, 5, 3], ['d','c','s','h','d']);
      let testScoreObj = getWinner(playerData, tableCards);
      expect(testScoreObj).toEqual('true_draw_placeholder');
      playerData.player.hand = createHand([9, 2], ['h', 's']); // 3 oak, kicker 10
      playerData.ai1.hand = createHand([7, 8], ['d', 'c']);
      playerData.ai2.hand = createHand([9, 2], ['d', 'c']); // a pair
      playerData.ai3.hand = createHand([8, 3], ['h', 's']); // a pair
      tableCards = createHand([7, 2, 2, 5, 14], ['d','c','s','h','d']);
      testScoreObj = getWinner(playerData, tableCards);
      expect(testScoreObj).toEqual('true_draw_placeholder');
    });

  });



});