// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import Fuse from 'fuse.js';

import Preferences from '@mm-redux/constants/preferences';
import {selectEmojisByName, selectEmojisBySection} from '@selectors/emojis';
import initialState from '@store/initial_state';
import {shallowWithIntl} from 'test/intl-test-helper';

import {filterEmojiSearchInput} from './emoji_picker_base';
import EmojiPicker from './emoji_picker.ios';

jest.useFakeTimers();

describe('components/emoji_picker/emoji_picker.ios', () => {
    const state = {
        ...initialState,
        views: {
            recentEmojis: [],
        },
    };
    const emojis = selectEmojisByName(state);
    const emojisBySection = selectEmojisBySection(state);
    const options = {
        shouldSort: false,
        threshold: 0.3,
        location: 0,
        distance: 10,
        includeMatches: true,
        findAllMatches: true,
    };
    const fuse = new Fuse(emojis, options);

    const baseProps = {
        actions: {
            getCustomEmojis: jest.fn(),
            incrementEmojiPickerPage: jest.fn(),
            searchCustomEmojis: jest.fn(),
        },
        customEmojisEnabled: false,
        customEmojiPage: 200,
        deviceWidth: 400,
        emojis,
        emojisBySection,
        fuse,
        isLandscape: false,
        theme: Preferences.THEMES.default,
    };

    const testCases = [
        {input: 'smile', output: 'smile'},
        {input: 'SMILE', output: 'smile'},
        {input: ':smile', output: 'smile'},
        {input: ':SMILE', output: 'smile'},
        {input: 'smile:', output: 'smile'},
        {input: 'SMILE:', output: 'smile'},
        {input: ':smile:', output: 'smile'},
        {input: ':SMILE:', output: 'smile'},
    ];

    testCases.forEach((testCase) => {
        test(`'${testCase.input}' should return '${testCase.output}'`, async () => {
            expect(filterEmojiSearchInput(testCase.input)).toEqual(testCase.output);
        });
    });

    test('should match snapshot', async () => {
        const wrapper = shallowWithIntl(<EmojiPicker {...baseProps}/>);
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('searchEmojis should return the right values on fuse', async () => {
        const input = '1';
        const output = ['100', '1234', '1st_place_medal', '+1', '-1', 'u7121'];

        const wrapper = shallowWithIntl(<EmojiPicker {...baseProps}/>);
        const result = wrapper.instance().searchEmojis(input);
        expect(result).toEqual(output);
    });

    test('should set rebuildEmojis to true when deviceWidth changes', async () => {
        const wrapper = shallowWithIntl(<EmojiPicker {...baseProps}/>);
        const instance = wrapper.instance();

        expect(instance.rebuildEmojis).toBe(undefined);

        const newDeviceWidth = baseProps.deviceWidth * 2;
        wrapper.setProps({deviceWidth: newDeviceWidth});

        expect(instance.rebuildEmojis).toBe(true);
    });

    test('should rebuild emojis emojis when emojis change', async () => {
        const wrapper = shallowWithIntl(<EmojiPicker {...baseProps}/>);
        const instance = wrapper.instance();
        const renderableEmojis = jest.spyOn(instance, 'renderableEmojis');

        expect(instance.rebuildEmojis).toBe(undefined);

        const newEmojis = [{}];
        wrapper.setProps({emojis: newEmojis});

        expect(renderableEmojis).toHaveBeenCalledWith(baseProps.emojisBySection, baseProps.deviceWidth);
    });

    test('should set rebuilt emojis when rebuildEmojis is true and searchBarAnimationComplete is true', async () => {
        const wrapper = shallowWithIntl(<EmojiPicker {...baseProps}/>);
        const instance = wrapper.instance();
        instance.setState = jest.fn();
        instance.renderableEmojis = jest.spyOn(instance, 'renderableEmojis');

        instance.rebuildEmojis = true;
        const searchBarAnimationComplete = true;
        const setRebuiltEmojis = jest.spyOn(instance, 'setRebuiltEmojis');
        setRebuiltEmojis(searchBarAnimationComplete);

        expect(instance.setState).toHaveBeenCalledTimes(1);
        expect(instance.rebuildEmojis).toBe(false);
    });

    test('should not set rebuilt emojis when rebuildEmojis is false and searchBarAnimationComplete is true', async () => {
        const wrapper = shallowWithIntl(<EmojiPicker {...baseProps}/>);
        const instance = wrapper.instance();
        instance.setState = jest.fn();

        instance.rebuildEmojis = false;
        const searchBarAnimationComplete = true;
        const setRebuiltEmojis = jest.spyOn(instance, 'setRebuiltEmojis');
        setRebuiltEmojis(searchBarAnimationComplete);

        expect(instance.setState).not.toHaveBeenCalled();
    });

    test('should not set rebuilt emojis when rebuildEmojis is true and searchBarAnimationComplete is false', async () => {
        const wrapper = shallowWithIntl(<EmojiPicker {...baseProps}/>);
        const instance = wrapper.instance();
        instance.setState = jest.fn();

        instance.rebuildEmojis = true;
        const searchBarAnimationComplete = false;
        const setRebuiltEmojis = jest.spyOn(instance, 'setRebuiltEmojis');
        setRebuiltEmojis(searchBarAnimationComplete);

        expect(instance.setState).not.toHaveBeenCalled();
    });
});

