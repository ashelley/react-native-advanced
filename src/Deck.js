import React, {Component} from 'react'
import {
    View,
    Animated,
    PanResponder,
    Dimensions,
    LayoutAnimation,
    UIManager
} from 'react-native'

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH
const SWIPT_OUT_DURATION = 0.2
const DIRECTION_LEFT = -1
const DIRECTION_RIGHT = 1


class Deck extends Component {

    static defaultProps = {
        onSwipeLeft: () => {},
        onSwipeRight: () => {},
        renderNoMoreCards:()=>{}
    }

    constructor(props) {
        super(props)
        var position = new Animated.ValueXY();
        const layoutPosition = new Animated.ValueXY();        
        const panResponder = this.createPanResponder(position)
        this.state = {panResponder, layoutPosition, position, index: 0}
    }

    createPanResponder(position) {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: this.createSwipeMoveHandler(position),
            onPanResponderRelease: this.createSwipeReleaseHandler(position)
        })
    }

    createSwipeReleaseHandler(position) {
        return (event, gesture) => {
            if(gesture.dx > SWIPE_THRESHOLD) {
                this.forceSwipe(position,DIRECTION_RIGHT)                    
            } else if(gesture.dx < -SWIPE_THRESHOLD) {
                this.forceSwipe(position,DIRECTION_LEFT)
            } else {
                this.resetPosition(position)
            }
        }
    }

    createSwipeMoveHandler(position) {
        return (event, gesture) => {
            position.setValue({x: gesture.dx, y:gesture.dy})
        }
    }

    forceSwipe(position,direction) {
        var item = this.props.data[this.state.index]
        Animated.timing(position, {
            toValue: {
                x: SCREEN_WIDTH * direction,
                y: 0                
            },
            duration: -SWIPT_OUT_DURATION
        }).start(() => {
            this.onSwipeComplete(item, direction)
        })
    }

    onSwipeComplete(item, direction) {
        const { onSwipeLeft, onSwipeRight, data} = this.props;
        if(direction == DIRECTION_LEFT) {
            onSwipeLeft(item)
        } else {
            onSwipeRight(item)
        }
        Animated.timing(this.state.layoutPosition, {
            toValue: { x: 0, y: -10},
            duration: 300
        }).start(() => {
            this.state.position.setValue({x: 0, y: 0})        
            this.state.layoutPosition.setValue({x: 0,y: 0})            
            this.setState({index: this.state.index + 1})
        })
    }

    resetPosition(position) {
        Animated.spring(position, {
            toValue: {x:0, y: 0}
        }).start();        
    }

    getCardStyle() {
        const {position} = this.state
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.5,0,SCREEN_WIDTH * 1.5],
            outputRange: ['-120deg', '0deg','120deg']
        })

        return {
            ...position.getLayout(),
            transform: [{
                rotate
            }]                      
        }
    }

    renderCards() {

        if(this.state.index >= this.props.data.length) {
            return this.props.renderNoMoreCards() || null;
        }

        const cardStyle = {
            position: 'absolute',
            width: SCREEN_WIDTH,
            zIndex: 1,
            elevation: 1,
        }        
        let data = this.props.data
        let cards = []
        for(let i = 0; i < data.length; i++) {
            let itemIndex = data.length - i  - 1      
            let item = data[itemIndex]
            let key = item.id;
            if(itemIndex < this.state.index) continue
            let top = (10 * (itemIndex - this.state.index))
            if(itemIndex == this.state.index) {
                cards.push(<Animated.View 
                    key={i}
                    style={[this.getCardStyle(), cardStyle,{top}]}
                    {...this.state.panResponder.panHandlers}                    
                > 
                    {this.props.renderCard(item)}
                 </Animated.View>)
            } else {
                cards.push((<Animated.View key={i} style={[cardStyle,{top}]}>
                    {this.props.renderCard(item)}
                </Animated.View>))
            }
        }
        return cards        
    }

    render() {
        return (
            <Animated.View style={this.state.layoutPosition.getLayout()}> 
                {this.renderCards()}
            </Animated.View>
        )
    }
}

export default Deck;