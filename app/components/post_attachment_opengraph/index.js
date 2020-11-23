// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {getDimensions} from 'app/selectors/device';

import PostAttachmentOpenGraph from './post_attachment_opengraph';

function mapStateToProps(state) {
    return {
        ...getDimensions(state),
    };
}

export default connect(mapStateToProps)(PostAttachmentOpenGraph);

