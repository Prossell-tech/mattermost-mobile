// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Fuse from 'fuse.js';

import {incrementEmojiPickerPage} from '@actions/views/emoji';
import {getCustomEmojis} from '@mm-redux/actions/emojis';
import {getTheme} from '@mm-redux/selectors/entities/preferences';
import {getConfig} from '@mm-redux/selectors/entities/general';
import {getDimensions, isLandscape} from '@selectors/device';
import {selectEmojisByName, selectEmojisBySection} from '@selectors/emojis';

import EmojiPicker from './emoji_picker';

function mapStateToProps(state) {
    const emojisBySection = selectEmojisBySection(state);
    const emojis = selectEmojisByName(state);
    const {deviceWidth} = getDimensions(state);
    const options = {
        shouldSort: false,
        threshold: 0.3,
        location: 0,
        distance: 10,
        includeMatches: true,
        findAllMatches: true,
    };

    const list = emojis.length ? emojis : [];
    const fuse = new Fuse(list, options);

    return {
        fuse,
        emojis,
        emojisBySection,
        deviceWidth,
        isLandscape: isLandscape(state),
        theme: getTheme(state),
        customEmojisEnabled: getConfig(state).EnableCustomEmoji === 'true',
        customEmojiPage: state.views.emoji.emojiPickerCustomPage,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            getCustomEmojis,
            incrementEmojiPickerPage,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(EmojiPicker);

